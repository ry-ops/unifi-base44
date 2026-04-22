import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Bot, User, Loader2, Trash2, Check, X, Terminal, AlertTriangle } from "lucide-react";

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
    const serializable = messages.map(m => ({
      role: m.role,
      content: m.content,
      actionResult: m.actionResult || null,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable.slice(-MAX_STORED)));
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

function parseActionProposals(text) {
  const proposals = [];
  const regex = /ACTION_PROPOSAL:\s*(\{[\s\S]*?\})(?=\n|$|ACTION_PROPOSAL:)/g;
  let match;
  while ((match = regex.exec(text + "\nACTION_PROPOSAL:")) !== null) {
    try { proposals.push(JSON.parse(match[1])); } catch {}
  }
  return proposals;
}

function ActionProposalCard({ proposal, onConfirm, onDeny, executed }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 w-full max-w-lg mt-2">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Action Proposal</span>
      </div>
      <p className="text-sm text-slate-200 mb-1">{proposal.description}</p>
      {proposal.warning && (
        <p className="text-xs text-amber-300/70 mb-2">{proposal.warning}</p>
      )}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-3 bg-slate-900/50 rounded p-2 overflow-x-auto">
        <Terminal className="w-3 h-3 flex-shrink-0" />
        <span className="text-blue-300">{proposal.method}</span>&nbsp;{proposal.path}
      </div>
      {proposal.body && (
        <pre className="text-xs text-slate-400 bg-slate-900/50 rounded p-2 mb-3 overflow-x-auto max-h-32">
          {JSON.stringify(proposal.body, null, 2)}
        </pre>
      )}
      {!executed && (
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm(proposal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs text-white font-medium transition-colors"
          >
            <Check className="w-3 h-3" /> Approve & Execute
          </button>
          <button
            onClick={() => onDeny(proposal)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 font-medium transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message, onConfirm, onDeny, executedProposals }) {
  const isUser = message.role === "user";
  const proposals = !isUser ? parseActionProposals(message.content) : [];
  const cleanText = message.content.replace(/ACTION_PROPOSAL:\s*\{[\s\S]*?\}(?=\n|$|ACTION_PROPOSAL:)/g, "").trim();

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? "bg-blue-600" : "bg-slate-700"}`}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-blue-400" />}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        {cleanText && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm whitespace-pre-wrap"
              : "bg-slate-800 rounded-tl-sm border border-slate-700/50"
          }`}>
            {isUser ? cleanText : renderMarkdown(cleanText)}
          </div>
        )}

        {proposals.map((proposal, idx) => (
          <ActionProposalCard
            key={idx}
            proposal={proposal}
            onConfirm={onConfirm}
            onDeny={onDeny}
            executed={executedProposals?.has(JSON.stringify(proposal))}
          />
        ))}

        {message.actionResult && (
          <div className={`text-xs px-3 py-2 rounded-lg border font-mono ${
            message.actionResult.ok
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {message.actionResult.ok ? "✓ Executed successfully" : "✗ Execution failed"} — HTTP {message.actionResult.status}
            {message.actionResult.data && (
              <pre className="mt-1 text-slate-400 whitespace-pre-wrap max-h-40 overflow-auto">
                {JSON.stringify(message.actionResult.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const WELCOME_MSG = {
  role: "assistant",
  content: "Hi! I'm your UniFi AI assistant. I can help you monitor your network and make configuration changes.\n\n**How it works:** I generate action proposals → you click **Approve & Execute** → the backend makes the real API call to UniFi → I summarize the response.\n\nWhat would you like to do?",
};

export default function ChatPanel({ contextData }) {
  const [messages, setMessages] = useState(() => loadHistory() || [WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executedProposals] = useState(() => new Set());
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

  const handleConfirmAction = async (proposal) => {
    executedProposals.add(JSON.stringify(proposal));
    setLoading(true);

    const response = await base44.functions.invoke("unifiChat", {
      messages: [],
      contextData,
      pendingAction: proposal,
    });
    const result = response.data?.actionResult;

    // Feed the result back to the AI to summarize
    const resultContent = `Action executed: ${proposal.description}\nHTTP ${result?.status}\nResponse:\n${JSON.stringify(result?.data, null, 2)}`;
    const followUpMessages = [
      ...messages,
      { role: "user", content: resultContent }
    ];

    const summaryRes = await base44.functions.invoke("unifiChat", {
      messages: followUpMessages,
      contextData,
    });
    const summaryReply = summaryRes.data?.reply || (result?.ok ? "Action completed successfully." : `Action failed (HTTP ${result?.status}).`);

    setMessages(prev => [...prev, {
      role: "assistant",
      content: summaryReply,
      actionResult: result,
    }]);
    setLoading(false);
  };

  const handleDenyAction = (proposal) => {
    executedProposals.add(JSON.stringify(proposal));
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Action cancelled. Let me know if you'd like to proceed differently.",
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
            executedProposals={executedProposals}
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
        <div className="flex justify-end mb-2">
          <button
            onClick={clearHistory}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30"
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
            placeholder="Ask about your network or request a change..."
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