import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, AlertTriangle, Check, X, Terminal } from "lucide-react";

function renderMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Heading
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="text-sm font-bold text-white mt-3 mb-1">{line.slice(4)}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>);
      i++; continue;
    }

    // Table detection: starts with |
    if (line.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows (---|---)
      const rows = tableLines.filter(l => !l.match(/^\|[\s\-|]+\|$/));
      const parseRow = (l) => l.split("|").slice(1, -1).map(c => c.trim());
      const [header, ...body] = rows;
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-lg border border-slate-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-700/60 border-b border-slate-600">
                {parseRow(header || "").map((cell, ci) => (
                  <th key={ci} className="px-3 py-2 text-left text-slate-300 font-semibold">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className={`border-b border-slate-700/50 ${ri % 2 === 0 ? "" : "bg-slate-700/20"}`}>
                  {parseRow(row).map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-slate-300">{cell || <span className="text-slate-600 italic">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
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

    // Blank line
    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-sm text-slate-200 leading-relaxed">{inlineFormat(line)}</p>
    );
    i++;
  }

  return elements;
}

function inlineFormat(text) {
  // Handle **bold**, *italic*, and `code`
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match;
  let key = 0;
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
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap"
            : "bg-slate-800 rounded-tl-sm border border-slate-700/50"
        }`}>
          {isUser ? (cleanText || message.content) : renderMarkdown(cleanText || message.content)}
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

    // For successful reads (GET), ask the AI to summarize the response data
    const isRead = action.method === "GET";
    if (result?.ok && isRead) {
      const summaryMessages = [
        ...messages.filter(m => !m.actionProposal),
        { role: "user", content: `Here is the API response data. Please summarize it in a clean, human-readable format:\n\n${JSON.stringify(result.data, null, 2)}` }
      ];
      const summaryRes = await base44.functions.invoke("unifiChat", {
        messages: summaryMessages,
        contextData,
      });
      const summaryReply = summaryRes.data?.reply || "Action completed successfully.";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: summaryReply,
        actionProposal: parseActionProposal(summaryReply),
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: result?.ok
          ? "Action completed successfully."
          : `Action failed with status ${result?.status}: ${JSON.stringify(result?.data)}`,
        actionResult: result,
      }]);
    }
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