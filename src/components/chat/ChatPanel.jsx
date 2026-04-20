import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, AlertTriangle, Check, X, Terminal } from "lucide-react";

function parseActionProposal(text) {
  const match = text.match(/ACTION_PROPOSAL:\s*(\{[\s\S]*?\})/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  return null;
}

function MessageBubble({ message, onConfirm, onDeny }) {
  const isUser = message.role === "user";
  const hasAction = message.actionProposal;
  const cleanText = message.content.replace(/ACTION_PROPOSAL:\s*\{[\s\S]*?\}/g, "").trim();

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-blue-600" : "bg-slate-700"}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-blue-400" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/50"
        }`}>
          {cleanText || message.content}
        </div>

        {hasAction && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Action Required</span>
            </div>
            <p className="text-sm text-slate-200 mb-1">{hasAction.description}</p>
            {hasAction.warning && (
              <p className="text-xs text-amber-300/70 mb-3">{hasAction.warning}</p>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-3 bg-slate-900/50 rounded p-2">
              <Terminal className="w-3 h-3" />
              {hasAction.method} {hasAction.path}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onConfirm(hasAction)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs text-white font-medium transition-colors"
              >
                <Check className="w-3 h-3" /> Confirm
              </button>
              <button
                onClick={onDeny}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 font-medium transition-colors"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        )}

        {message.actionResult && (
          <div className={`text-xs px-3 py-2 rounded-lg border font-mono ${
            message.actionResult.ok
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {message.actionResult.ok ? "✓ Action executed successfully" : "✗ Action failed"} (HTTP {message.actionResult.status})
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ contextData }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm your UniFi AI assistant. I can help you monitor your network, answer questions about your devices and clients, and make configuration changes (with your confirmation). What would you like to know or do?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const response = await base44.functions.invoke("unifiChat", {
      messages: newMessages,
      contextData,
    });

    const reply = response.data?.reply || "I couldn't process that request.";
    const actionProposal = parseActionProposal(reply);

    setMessages(prev => [...prev, {
      role: "assistant",
      content: reply,
      actionProposal,
    }]);
    setLoading(false);
  };

  const handleConfirmAction = async (action) => {
    setMessages(prev => prev.map(m =>
      m.actionProposal === action ? { ...m, actionProposal: null } : m
    ));
    setLoading(true);
    const response = await base44.functions.invoke("unifiChat", {
      messages: [],
      contextData,
      pendingAction: action,
    });
    const result = response.data?.actionResult;
    setMessages(prev => [...prev, {
      role: "assistant",
      content: result?.ok
        ? `Action completed successfully. Response: ${JSON.stringify(result.data, null, 2)}`
        : `Action failed with status ${result?.status}: ${JSON.stringify(result?.data)}`,
      actionResult: result,
    }]);
    setLoading(false);
  };

  const handleDenyAction = () => {
    setMessages(prev => prev.map((m, i) =>
      i === prev.length - 1 && m.actionProposal ? { ...m, actionProposal: null } : m
    ));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Action cancelled. Let me know if you'd like to do something else.",
    }]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            onConfirm={handleConfirmAction}
            onDeny={handleDenyAction}
          />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your network or request changes..."
            className="flex-1 bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {["Show all alarms", "List offline devices", "How many clients are connected?", "Show firewall rules"].map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700/50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}