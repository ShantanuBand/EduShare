import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Button } from "@/components/ui-elements";
import { Bot, Send, Loader2, Sparkles, FileText, Plus, X, Upload } from "lucide-react";
import { useListResources } from "@workspace/api-client-react";

export default function AiChatPage() {
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your AI Study Assistant. Please attach a note if you'd like me to summarize it or generate study questions for you!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch some resources so the user can select one
  const { data: resourcesData, isLoading: resourcesLoading } = useListResources({
    limit: 50,
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsDropdownOpen(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ai/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to extract text");
      }
      
      const data = await res.json();
      
      setSelectedResource({
        id: null,
        fileId: null,
        directText: data.text,
        title: data.fileName,
        isLocal: true,
      });
    } catch (err) {
      console.error("Failed to upload local file:", err);
      alert(`Failed to upload file: ${err.message}`);
    } finally {
      setIsUploading(false);
      // Reset input so they can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: userMessage },
    ]);

    setIsLoading(true);

    try {
      const lowerInput = userMessage.toLowerCase();
      let action = "qa";
      if (lowerInput.includes("summarize") || lowerInput.includes("summary") || lowerInput.includes("points")) {
        action = "summarize";
      } else if (lowerInput.includes("flashcard")) {
        action = "flashcards";
      } else if (lowerInput.includes("mcq") || lowerInput.includes("quiz")) {
        action = "mcq";
      }

      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResource?.id ? Number(selectedResource.id) : undefined,
          fileId: selectedResource?.fileId ? Number(selectedResource.fileId) : undefined,
          directText: selectedResource?.directText || undefined,
          documentTitle: selectedResource?.title || undefined,
          prompt: userMessage,
          action,
        }),
      });

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "Sorry, I couldn't process that request right now." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickAction = (text) => {
    setInput(text);
    setTimeout(() => {
      document.getElementById("ai-chat-form")?.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }, 0);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col h-[85vh] py-4">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              AI Study Assistant
            </h1>
            <p className="text-slate-600 mt-1">Ask me anything, or attach a document to summarize and generate questions.</p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-indigo-100 shadow-xl bg-white">
          {/* Quick Actions */}
          <div className="bg-indigo-50/50 p-3 border-b border-indigo-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
            <button 
              onClick={() => sendQuickAction("Please summarize these notes into key points.")}
              className="text-sm bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full whitespace-nowrap hover:bg-indigo-50 font-medium transition-colors"
            >
              Summarize into points
            </button>
            <button 
              onClick={() => sendQuickAction("Generate 3 MCQs from these notes")}
              className="text-sm bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full whitespace-nowrap hover:bg-indigo-50 font-medium transition-colors"
            >
              Generate MCQs
            </button>
            <button 
              onClick={() => sendQuickAction("Create some flashcards for me")}
              className="text-sm bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-full whitespace-nowrap hover:bg-indigo-50 font-medium transition-colors"
            >
              Create Flashcards
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3.5 text-[15px] ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t shrink-0 relative">
            <form id="ai-chat-form" onSubmit={handleSend} className="flex gap-3 items-end">
              <div className="flex-1 min-h-[48px] rounded-xl border-2 border-slate-200 bg-white ring-offset-background focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all duration-200 flex flex-wrap items-center p-1 gap-1 relative">
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf"
                />

                {/* Attach Button */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-10 w-10 shrink-0 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-10 flex flex-col p-1">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        Upload
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-start gap-2 transition-colors mb-1 font-medium"
                      >
                        <Upload className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="truncate">Upload from device...</span>
                      </button>
                      
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-100 mt-1">
                        Select EduShare Document
                      </div>
                      {resourcesLoading ? (
                        <div className="p-3 text-sm text-slate-400 text-center">Loading...</div>
                      ) : (
                        resourcesData?.resources?.map((res) => (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => {
                              setSelectedResource(res);
                              setIsDropdownOpen(false);
                            }}
                            className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg flex items-start gap-2 transition-colors"
                          >
                            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                            <span className="truncate">{res.title}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Resource Pill */}
                {isUploading ? (
                  <div className="flex items-center gap-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium animate-pulse shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : selectedResource ? (
                  <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1.5 text-sm font-medium animate-in zoom-in-95 duration-200 shrink-0 max-w-[200px] sm:max-w-[300px]">
                    <FileText className="w-4 h-4 shrink-0 opacity-70" />
                    <span className="truncate">{selectedResource.title}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedResource(null)}
                      className="shrink-0 p-0.5 hover:bg-indigo-200/50 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}

                <input
                  placeholder={selectedResource ? "Ask a question about this document..." : "Ask me to summarize, or quiz you..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 min-w-[120px] h-10 bg-transparent px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 h-12 shrink-0 rounded-xl"
              >
                <Send className="w-5 h-5 sm:mr-2" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
