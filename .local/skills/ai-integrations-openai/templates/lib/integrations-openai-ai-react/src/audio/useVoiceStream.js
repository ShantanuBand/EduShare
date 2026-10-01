import { useCallback, useEffect, useRef } from "react";
import { useAudioPlayback } from "./useAudioPlayback.js";

const SSE_EVENT_DELIMITER = /\r\n\r\n|\n\n|\r\r/g;

function createAbortError() {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

function toError(error) {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Unknown error");
}

function notifyError(callbacks, error) {
  try {
    callbacks.onError?.(error);
  } catch {
    // Do not let onError mask the original error.
  }
}

function isVoiceStreamEvent(value) {
  if (!value || typeof value !== "object") return false;

  const record = value;

  if (record.done === true) return true;

  switch (record.type) {
    case "user_transcript":
    case "transcript":
    case "audio":
      return typeof record.data === "string";
    case "error":
      return typeof record.error === "string";
    default:
      return false;
  }
}

function parseVoiceStreamEvent(raw) {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Received malformed SSE JSON payload");
  }

  if (!isVoiceStreamEvent(parsed)) {
    throw new Error("Received unexpected SSE event shape");
  }

  return parsed;
}

function readSseDataFromBlock(block) {
  const normalizedBlock = block.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const dataLines = [];

  for (const line of normalizedBlock.split("\n")) {
    if (!line.startsWith("data:")) {
      continue;
    }

    // SSE allows one optional leading space after the colon.
    dataLines.push(line.slice(5).replace(/^ /, ""));
  }

  if (dataLines.length === 0) {
    return null;
  }

  return dataLines.join("\n");
}

function extractCompleteSseBlocks(buffer) {
  const blocks = [];
  let lastIndex = 0;

  SSE_EVENT_DELIMITER.lastIndex = 0;

  let match;
  while ((match = SSE_EVENT_DELIMITER.exec(buffer)) !== null) {
    blocks.push(buffer.slice(lastIndex, match.index));
    lastIndex = match.index + match[0].length;
  }

  return {
    blocks,
    remaining: buffer.slice(lastIndex),
  };
}

function isDoneEvent(event) {
  return "done" in event && event.done === true;
}

function handleVoiceStreamEvent(event, playback, callbacks, state) {
  if (isDoneEvent(event)) {
    if (!state.didComplete) {
      state.didComplete = true;
      playback.signalComplete();
      callbacks.onComplete?.(state.fullTranscript);
    }
    return;
  }

  switch (event.type) {
    case "user_transcript":
      callbacks.onUserTranscript?.(event.data);
      return;

    case "transcript":
      state.fullTranscript += event.data;
      callbacks.onTranscript?.(event.data, state.fullTranscript);
      return;

    case "audio":
      playback.pushAudio(event.data);
      return;

    case "error":
      throw new Error(event.error);
  }
}

async function blobToBase64(blob, signal) {
  if (signal?.aborted) {
    throw createAbortError();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
    };

    const onAbort = () => {
      cleanup();

      try {
        reader.abort();
      } catch {
        // Ignore abort races if the read already finished.
      }
      reject(createAbortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    reader.onload = () => {
      const result = reader.result;
      cleanup();

      if (typeof result !== "string") {
        reject(new Error("Failed to read audio blob"));
        return;
      }

      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Failed to parse audio data URL"));
        return;
      }

      resolve(result.slice(commaIndex + 1));
    };

    reader.onerror = () => {
      const error = reader.error ?? new Error("Failed to read audio blob");
      cleanup();
      reject(error);
    };

    reader.onabort = () => {
      cleanup();
      reject(createAbortError());
    };

    reader.readAsDataURL(blob);
  });
}

async function readErrorText(response) {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
}

export function useVoiceStream({ workletPath, ...callbacks }) {
  const playback = useAudioPlayback(workletPath);

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const playbackRef = useRef(playback);
  playbackRef.current = playback;

  const activeRequestRef = useRef(null);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
    };
  }, []);

  const streamVoiceResponse = useCallback(async (url, audioBlob) => {
    activeRequestRef.current?.abort();

    const abortController = new AbortController();
    activeRequestRef.current = abortController;

    const throwIfNotCurrent = () => {
      if (
        abortController.signal.aborted ||
        activeRequestRef.current !== abortController
      ) {
        throw createAbortError();
      }
    };

    const processBlocks = (blocks, state) => {
      for (const block of blocks) {
        throwIfNotCurrent();

        const rawData = readSseDataFromBlock(block);
        if (!rawData) {
          continue;
        }

        const event = parseVoiceStreamEvent(rawData);
        handleVoiceStreamEvent(
          event,
          playbackRef.current,
          callbacksRef.current,
          state,
        );
      }
    };

    const state = {
      fullTranscript: "",
      didComplete: false,
    };

    try {
      await playbackRef.current.init();
      throwIfNotCurrent();

      playbackRef.current.clear();

      const base64Audio = await blobToBase64(audioBlob, abortController.signal);
      throwIfNotCurrent();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ audio: base64Audio }),
        signal: abortController.signal,
      });
      throwIfNotCurrent();

      if (!response.ok) {
        const detail = await readErrorText(response);
        throw new Error(
          detail
            ? `Voice request failed (${response.status} ${response.statusText}): ${detail}`
            : `Voice request failed (${response.status} ${response.statusText})`,
        );
      }

      if (!response.body) {
        throw new Error("Voice request failed: response body is missing");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          throwIfNotCurrent();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const { blocks, remaining } = extractCompleteSseBlocks(buffer);
          buffer = remaining;

          processBlocks(blocks, state);
        }

        // Flush any trailing UTF-8 bytes.
        buffer += decoder.decode();

        const { blocks, remaining } = extractCompleteSseBlocks(buffer);
        processBlocks(blocks, state);

        // Process a final unterminated event if the server closed without a trailing blank line.
        const finalData = readSseDataFromBlock(remaining);
        if (finalData) {
          throwIfNotCurrent();

          const event = parseVoiceStreamEvent(finalData);
          handleVoiceStreamEvent(
            event,
            playbackRef.current,
            callbacksRef.current,
            state,
          );
        }
      } finally {
        try {
          await reader.cancel();
        } catch {
          // Ignore cleanup errors.
        }
        reader.releaseLock();
      }
    } catch (error) {
      const err = toError(error);

      if (err.name === "AbortError") {
        return;
      }

      notifyError(callbacksRef.current, err);
      throw err;
    } finally {
      if (activeRequestRef.current === abortController) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  return { streamVoiceResponse, playbackState: playback.state };
}
