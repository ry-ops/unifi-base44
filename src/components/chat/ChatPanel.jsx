import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, Trash2 } from "lucide-react";

const STORAGE_KEY = "unifi_chat_history";
const MAX_STORED = 100;

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {}
}

function inlineFormat(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0, match, key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const m = match[0];
    if (m.startsWith("**")) parts.push(<strong key={key++} className="text-white font-semibold">{m.slice(2, -2)}</strong>);
    else if (m.startsWith("*")) parts.push(<em key={key++} className="text-slate-300 italic">{m.slice(1, -1)}</em>);
    else if (m.startsWith("`")) parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-slate-900 text-blue-300 font-mono text-xs">{m.slice(1, -1)}</code>);
    last = match.index + m.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) { elements.push(<h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(4)}</h3>); i++; continue; }
    if (line.startsWith("## ")) { elements.push(<h2 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith("# ")) { elements.push(<h1 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>); i++; continue; }

    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) { tableLines.push(lines[i]); i++; }
      const rows = tableLines.filter(l => !l.match(/^\|[\s\-|]+\|$/));
      const parseRow = (l) => l.split("|").slice(1, -1).map(c => c.trim());
      const [header, ...body] = rows;
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-lg border border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700/60 border-b border-slate-600">
                {parseRow(header || "").map((cell, ci) => <th key={ci} className="px-3 py-2 text-left text-slate-300 font-semibold">{cell}</th>)}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className={`border-b border-slate-700/50 ${ri % 2 === 0 ? "" : "bg-slate-700/20"}`}>
                  {parseRow(row).map((cell, ci) => <td key={ci} className="px-3 py-2 text-slate-300">{cell || <span className="text-slate-600 italic">—</span>}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.match(/^[-*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) { items.push(lines[i].slice(2)); i++; }
      elements.push(
        <ul key={`ul-${i}`} className="my-1 flex flex-col gap-0.5">
          {items.map((item, ii) => (
            <li key={ii} className="flex gap-2 text-slate-300 text-sm">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.trim() === "") { elements.push(<div key={i} className="h-1" />); i++; continue; }
    elements.push(<p key={i} className="text-sm text-slate-200 leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }

  return elements;
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-blue-600" : "bg-slate-700"}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-blue-400" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap"
            : "bg-slate-800 rounded-tl-sm border border-slate-700/50"
        }`}>
          {isUser ? message.content : renderMarkdown(message.content)}
        </div>
      </div>
    </div>
  );
}

const WELCOME_MSG = {
  role: "assistant",
  content: "Hi! I'm your UniFi AI assistant. I can help you analyze and understand your network data. I answer questions based on the context loaded from your dashboard — I can't make live API calls or execute changes directly. For live queries or configuration changes, use the **API Terminal** page.\n\nWhat would you like to know?",
};

export default function ChatPanel({ contextData }) {
  const [messages, setMessages] = useState(() => loadHistory() || [WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { saveHistory(messages); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([WELCOME_MSG]);
  };

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
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
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
        <div className="flex justify-end mb-2">
          <button
            onClick={clearHistory}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30"
            title="Clear conversation history"
          >
            <Trash2 className="w-3 h-3" /> Clear history
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about your network..."
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
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {["Show all alarms", "List offline devices", "How many clients are connected?", "Show firewall rules"].map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors text-left truncate"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}