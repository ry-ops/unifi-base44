import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { unifiCall, formatBytes } from "@/lib/unifi";
import { Wifi, RefreshCw, Signal, Radio, Activity } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

function signalColor(rssi) {
  if (rssi == null) return "text-slate-500";
  if (rssi >= -60) return "text-green-400";
  if (rssi >= -70) return "text-yellow-400";
  return "text-red-400";
}

function signalBg(rssi) {
  if (rssi == null) return "bg-slate-700";
  if (rssi >= -60) return "bg-green-500";
  if (rssi >= -70) return "bg-yellow-500";
  return "bg-red-500";
}

function signalLabel(rssi) {
  if (rssi == null) return "—";
  if (rssi >= -60) return "Excellent";
  if (rssi >= -70) return "Good";
  if (rssi >= -80) return "Fair";
  return "Poor";
}

function bandLabel(radio) {
  if (!radio) return "—";
  if (radio === "ng") return "2.4 GHz";
  if (radio === "na" || radio === "5") return "5 GHz";
  if (radio === "6g" || radio === "6") return "6 GHz";
  return radio.toUpperCase();
}

const BAND_COLORS = { "2.4 GHz": "#f59e0b", "5 GHz": "#3b82f6", "6 GHz": "#a78bfa" };

export default function WiFi() {
  const { selectedSite } = useNetwork();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (selectedSite?.hostId) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const siteRef = selectedSite?.meta?.name || "default";
    const result = await unifiCall("GET", `/v1/connector/consoles/${selectedSite.hostId}/proxy/network/api/s/${siteRef}/stat/sta`).catch(() => null);
    const all = Array.isArray(result?.data?.data) ? result.data.data : [];
    // Only WiFi clients
    setClients(all.filter(c => !c.is_wired));
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name || c.hostname || c.mac || "").toLowerCase().includes(q) || (c.essid || "").toLowerCase().includes(q);
  });

  // Band breakdown
  const bandMap = {};
  clients.forEach(c => {
    const band = bandLabel(c.radio);
    bandMap[band] = (bandMap[band] || 0) + 1;
  });
  const bandData = Object.entries(bandMap).map(([name, value]) => ({ name, value }));

  // SSID breakdown
  const ssidMap = {};
  clients.forEach(c => {
    const ssid = c.essid || "Unknown";
    ssidMap[ssid] = (ssidMap[ssid] || 0) + 1;
  });
  const ssidData = Object.entries(ssidMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // RSSI histogram buckets
  const rssiLabels = ["Excellent (≥-60)", "Good (-60 to -70)", "Fair (-70 to -80)", "Poor (<-80)"];
  const rssiCounts = [0, 0, 0, 0];
  clients.forEach(c => {
    const r = c.rssi ?? c.signal;
    if (r == null) return;
    if (r >= -60) rssiCounts[0]++;
    else if (r >= -70) rssiCounts[1]++;
    else if (r >= -80) rssiCounts[2]++;
    else rssiCounts[3]++;
  });
  const rssiData = rssiLabels.map((label, i) => ({ label, count: rssiCounts[i] })).filter(d => d.count > 0);
  const rssiColors = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-blue-400" /> WiFi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} wireless clients · {selectedSite.name}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Band breakdown donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-yellow-400" /> Band Distribution
          </h2>
          {bandData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">No data</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={bandData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                    {bandData.map((entry, i) => (
                      <Cell key={i} fill={BAND_COLORS[entry.name] || "#64748b"} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5">
                {bandData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BAND_COLORS[d.name] || "#64748b" }} />
                    <span className="text-slate-300">{d.name}</span>
                    <span className="text-white font-bold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signal strength histogram */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Signal className="w-4 h-4 text-green-400" /> Signal Quality
          </h2>
          {rssiData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={rssiData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#fff" }}
                />
                {rssiData.map((d, i) => (
                  <Bar key={d.label} dataKey="count" fill={rssiColors[rssiLabels.indexOf(d.label)]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {rssiData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rssiColors[rssiLabels.indexOf(d.label)] }} />
                <span className="text-slate-400 truncate">{d.label}</span>
                <span className="text-white font-bold ml-auto">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-SSID breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" /> Clients per SSID
          </h2>
          {ssidData.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-600 text-sm">No data</div>
          ) : (
            <div className="flex flex-col gap-2">
              {ssidData.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate">{d.name}</span>
                    <span className="text-white font-bold ml-2">{d.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${(d.value / clients.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WiFi Clients</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, SSID, or MAC..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 w-64"
          />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : !filtered.length ? (
          <div className="text-center py-12 text-slate-500 text-sm">No WiFi clients found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">SSID</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Band</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Signal</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Channel</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">TX / RX</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const rssi = c.rssi ?? c.signal;
                  const txRate = c.tx_rate ? `${(c.tx_rate / 1000).toFixed(0)} Mbps` : "—";
                  const rxRate = c.rx_rate ? `${(c.rx_rate / 1000).toFixed(0)} Mbps` : "—";
                  return (
                    <tr key={c._id || c.mac || i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{c.name || c.hostname || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-mono">{c.mac}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{c.essid || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {bandLabel(c.radio)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${signalBg(rssi)}`} />
                          <span className={`font-mono text-xs ${signalColor(rssi)}`}>{rssi != null ? `${rssi} dBm` : "—"}</span>
                          <span className="text-xs text-slate-500">({signalLabel(rssi)})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{c.channel || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                        <span className="text-blue-400">↑{txRate}</span> / <span className="text-green-400">↓{rxRate}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{c.ip || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}