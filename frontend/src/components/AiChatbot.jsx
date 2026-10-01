import { useState } from "react";
import { Bot, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button, Input, Card } from "./ui-elements";

export function AiChatbot({ resourceId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi! I'm your AI assistant. You can ask me to summarize these notes, generate flashcards, or answer questions about the material.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: userMessage },
    ]);

    setIsLoading(true);

    try {
      // Determine action based on basic keyword matching for the mock API
      const lowerInput = userMessage.toLowerCase();
      let action = "qa";
      if (lowerInput.includes("summarize") || lowerInput.includes("summary") || lowerInput.includes("points")) {
        action = "summarize";
      } else if (lowerInput.includes("flashcard")) {
        action = "flashcards";
      } else if (lowerInput.includes("mcq") || lowerInput.includes("quiz")) {
        action = "mcq";
      }

      // We need to pass authorization header if required. Since the API is /api/ai/assist
      // We will just fetch it directly.
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId,
          prompt: userMessage,
          action,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

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

  const handleQuickAction = (text) => {
    // We can't easily fake the event, so we'll just extract the logic.
    // To make it simple, we'll just set input and then call a helper, or just use a form submission.
    // Easiest is to set input and let user press send, but auto-send is better UX.
    const fakeEvent = { preventDefault: () => {} };
    setInput(text);
    // Use a small timeout so state updates, or just call directly by passing text
  };

  // Improved auto-send quick action
  const sendQuickAction = async (text) => {
    if (isLoading) return;
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: text },
    ]);

    setIsLoading(true);

    try {
      const lowerInput = text.toLowerCase();
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
        body: JSON.stringify({ resourceId, prompt: text, action }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: "Sorry, I couldn't process that request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 z-50 group"
      >
        <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] shadow-2xl flex flex-col z-50 border-indigo-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold font-display">AI Study Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-indigo-100 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-indigo-50 p-2 border-b border-indigo-100 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
        <button 
          onClick={() => sendQuickAction("Please summarize these notes into key points.")}
          className="text-xs bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-indigo-50 font-medium transition-colors"
        >
          Summarize into points
        </button>
        <button 
          onClick={() => sendQuickAction("Generate 3 MCQs from these notes")}
          className="text-xs bg-white text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-indigo-50 font-medium transition-colors"
        >
          Generate MCQs
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2 shrink-0">
        <Input
          placeholder="Ask something about these notes..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
