import React, { useState } from "react";
import { unifiCall } from "@/lib/unifi";
import { Terminal as TermIcon, Play, Copy, ChevronDown } from "lucide-react";

const PRESETS = [
  { label: "List Sites", method: "GET", path: "/v1/sites" },
  { label: "List Hosts", method: "GET", path: "/v1/hosts" },
  { label: "ISP Metrics", method: "GET", path: "/v1/isp-metrics" },
  { label: "System Info", method: "GET", path: "/ea/system" },
  { label: "List Admins", method: "GET", path: "/v1/admins" },
];

export default function Terminal() {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/v1/sites");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const execute = async () => {
    if (!path) return;
    let parsedBody = null;
    if (body.trim()) {
      parsedBody = JSON.parse(body);
    }

    setLoading(true);
    const startTime = Date.now();
    const result = await unifiCall(method, path, parsedBody);
    const elapsed = Date.now() - startTime;
    setResponse({ ...result, elapsed });
    setHistory(prev => [{ method, path, status: result?.status, time: new Date().toLocaleTimeString(), elapsed }, ...prev.slice(0, 19)]);
    setLoading(false);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2));
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TermIcon className="w-5 h-5 text-green-400" /> API Terminal
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Execute any UniFi Site Manager API call</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Request builder */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          {/* Presets */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Presets</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { setMethod(p.method); setPath(p.path); setBody(""); }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Request form */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50 w-28"
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="/v1/sites"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 outline-none focus:border-blue-500/50"
              />
              <button
                onClick={execute}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 rounded-lg text-sm text-white font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Run
              </button>
            </div>

            {(method !== "GET" && method !== "DELETE") && (
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder='{ "key": "value" }'
                rows={4}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
              />
            )}
          </div>

          {/* Response */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</span>
                {response && (
                  <>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${response.ok ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {response.status}
                    </span>
                    <span className="text-xs text-slate-600">{response.elapsed}ms</span>
                  </>
                )}
              </div>
              {response && (
                <button onClick={copyResponse} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="text-slate-500 text-sm">Executing...</div>
              ) : response ? (
                <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-600 text-sm">Run a request to see the response</div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!history.length ? (
              <div className="text-center text-slate-600 text-xs py-8">No requests yet</div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => { setMethod(h.method); setPath(h.path); }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-left transition-colors w-full"
                  >
                    <span className={`text-xs font-mono w-14 flex-shrink-0 ${h.method === "GET" ? "text-green-400" : h.method === "POST" ? "text-blue-400" : h.method === "DELETE" ? "text-red-400" : "text-yellow-400"}`}>
                      {h.method}
                    </span>
                    <span className="text-xs text-slate-300 font-mono truncate flex-1">{h.path}</span>
                    <span className={`text-xs flex-shrink-0 ${h.status < 300 ? "text-green-400" : "text-red-400"}`}>{h.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}