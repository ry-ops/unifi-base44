import React, { useState } from "react";
import { unifiCall } from "@/lib/unifi";
import { useNetwork } from "@/components/layout/AppLayout";
import { Terminal as TermIcon, Play, Copy, BookOpen, Clock } from "lucide-react";

function buildApiReference(hostId, networkSiteId) {
  const h = hostId || "{hostId}";
  const s = networkSiteId || "{siteId}";
  const cb = `/v1/connector/consoles/${h}/network/integration/v1`;

  return [
    {
      group: "Site Manager",
      color: "text-blue-400",
      endpoints: [
        { label: "List Sites", method: "GET", path: "/v1/sites" },
        { label: "List Hosts", method: "GET", path: "/v1/hosts" },
        { label: "Get Host", method: "GET", path: `/v1/hosts/${h}` },
        { label: "List Devices (global)", method: "GET", path: `/v1/devices?hostIds[]=${h}` },
        { label: "ISP Metrics (5m, 24h)", method: "GET", path: "/v1/isp-metrics/5m?duration=24h" },
        { label: "ISP Metrics (1h, 7d)", method: "GET", path: "/v1/isp-metrics/1h?duration=7d" },
        { label: "Query ISP Metrics", method: "POST", path: "/v1/isp-metrics/1h/query", body: `{"sites":[{"siteId":"${s}","hostId":"${h}"}]}` },
        { label: "List Admins", method: "GET", path: "/v1/admins" },
        { label: "System Info", method: "GET", path: "/ea/system" },
      ],
    },
    {
      group: "Network API — Sites & Devices",
      color: "text-green-400",
      endpoints: [
        { label: "Network Sites", method: "GET", path: `${cb}/sites` },
        { label: "Site Devices", method: "GET", path: `${cb}/sites/${s}/devices` },
        { label: "Site Clients", method: "GET", path: `${cb}/sites/${s}/clients` },
      ],
    },
    {
      group: "Network API — Config",
      color: "text-purple-400",
      endpoints: [
        { label: "Networks / VLANs", method: "GET", path: `${cb}/sites/${s}/networks` },
        { label: "WiFi Networks (WLANs)", method: "GET", path: `${cb}/sites/${s}/wlans` },
        { label: "Port Forwarding", method: "GET", path: `${cb}/sites/${s}/port-forwarding` },
        { label: "Traffic Routes", method: "GET", path: `${cb}/sites/${s}/traffic-routes` },
      ],
    },
    {
      group: "Network API — Security",
      color: "text-red-400",
      endpoints: [
        { label: "Firewall Policies", method: "GET", path: `${cb}/sites/${s}/firewall/policies` },
        { label: "Alarms", method: "GET", path: `${cb}/sites/${s}/alarms` },
        { label: "Events", method: "GET", path: `${cb}/sites/${s}/events` },
      ],
    },
    {
      group: "Network API — Actions",
      color: "text-yellow-400",
      endpoints: [
        { label: "Restart Device", method: "POST", path: `${cb}/sites/${s}/devices/{deviceId}/restart`, body: "{}" },
        { label: "Block Client", method: "POST", path: `${cb}/sites/${s}/clients/{clientId}/block`, body: "{}" },
        { label: "Unblock Client", method: "POST", path: `${cb}/sites/${s}/clients/{clientId}/unblock`, body: "{}" },
        { label: "Create Firewall Policy", method: "POST", path: `${cb}/sites/${s}/firewall/policies`, body: `{"name":"New Rule","action":{"type":"BLOCK"},"enabled":true}` },
        { label: "Create Port Forward", method: "POST", path: `${cb}/sites/${s}/port-forwarding`, body: `{"name":"New Rule","enabled":true}` },
      ],
    },
  ];
}

const METHOD_COLORS = {
  GET: "text-green-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  PATCH: "text-yellow-400",
  DELETE: "text-red-400",
};

export default function Terminal() {
  const { selectedSite } = useNetwork();
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/v1/sites");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sidebarTab, setSidebarTab] = useState("api"); // "api" | "history"

  const hostId = selectedSite?.hostId || "";
  const networkSiteId = selectedSite?.networkSiteId || selectedSite?.id || "";
  const apiRef = buildApiReference(hostId, networkSiteId);

  const execute = async () => {
    if (!path) return;
    let parsedBody = null;
    if (body.trim()) parsedBody = JSON.parse(body);
    setLoading(true);
    const startTime = Date.now();
    const result = await unifiCall(method, path, parsedBody);
    const elapsed = Date.now() - startTime;
    setResponse({ ...result, elapsed });
    setHistory(prev => [{ method, path, status: result?.status, time: new Date().toLocaleTimeString(), elapsed }, ...prev.slice(0, 19)]);
    setLoading(false);
  };

  const loadEndpoint = (ep) => {
    setMethod(ep.method);
    setPath(ep.path);
    setBody(ep.body || "");
    setResponse(null);
  };

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-hidden">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <TermIcon className="w-5 h-5 text-green-400" /> API Terminal
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Execute UniFi API calls · Site: <span className="text-slate-400">{selectedSite?.name || "none"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left: Request + Response */}
        <div className="xl:col-span-2 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Request form */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col gap-3 flex-shrink-0">
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
          <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
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
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(response?.data, null, 2))}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
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

        {/* Right: API Reference + History */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 flex-shrink-0">
            <button
              onClick={() => setSidebarTab("api")}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${sidebarTab === "api" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> API Reference
            </button>
            <button
              onClick={() => setSidebarTab("history")}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${sidebarTab === "history" ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}
            >
              <Clock className="w-3.5 h-3.5" /> History {history.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300">{history.length}</span>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "api" ? (
              <div className="p-2 flex flex-col gap-3">
                {!hostId && (
                  <div className="mx-2 mt-1 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                    No site selected — paths use placeholders
                  </div>
                )}
                {apiRef.map(group => (
                  <div key={group.group}>
                    <div className={`px-2 py-1.5 text-xs font-bold uppercase tracking-wider ${group.color}`}>
                      {group.group}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.endpoints.map(ep => (
                        <button
                          key={ep.label}
                          onClick={() => loadEndpoint(ep)}
                          className="flex items-start gap-2 px-2 py-2 rounded-lg hover:bg-slate-800 text-left transition-colors w-full group"
                        >
                          <span className={`text-xs font-mono w-12 flex-shrink-0 mt-0.5 ${METHOD_COLORS[ep.method] || "text-slate-400"}`}>
                            {ep.method}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-slate-200 group-hover:text-white transition-colors">{ep.label}</span>
                            <span className="text-xs text-slate-600 font-mono truncate">{ep.path}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2">
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
                        <span className={`text-xs font-mono w-14 flex-shrink-0 ${METHOD_COLORS[h.method] || "text-slate-400"}`}>
                          {h.method}
                        </span>
                        <span className="text-xs text-slate-300 font-mono truncate flex-1">{h.path}</span>
                        <span className={`text-xs flex-shrink-0 ${h.status < 300 ? "text-green-400" : "text-red-400"}`}>{h.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}