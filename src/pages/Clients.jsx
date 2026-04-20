import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteClients, formatBytes } from "@/lib/unifi";
import { Users, Wifi, Activity, UserCheck, RefreshCw, Search, Monitor, Smartphone } from "lucide-react";

function connectionIcon(client) {
  if (client.type === "WIRELESS" || client.connectionType === "wireless" || client.wlanId) {
    return <Wifi className="w-3.5 h-3.5 text-blue-400" />;
  }
  return <Activity className="w-3.5 h-3.5 text-green-400" />;
}

export default function Clients() {
  const { selectedSite } = useNetwork();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedSite?.hostId && selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    setError(null);
    const result = await getSiteClients(selectedSite.hostId, selectedSite.id).catch(e => { setError(e?.message || "Failed"); return null; });
    const list = Array.isArray(result?.data?.data) ? result.data.data
      : Array.isArray(result?.data) ? result.data : [];
    setClients(list);
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  const counts = selectedSite.statistics?.counts || {};
  const smTotal = (counts.wifiClient || 0) + (counts.wiredClient || 0);
  const totalClients = clients.length || smTotal;
  const wifiClients = clients.length ? clients.filter(c => c.type === "WIRELESS" || c.connectionType === "wireless" || c.wlanId) : [];
  const wiredClients = clients.length ? clients.filter(c => c.type === "WIRED" || c.connectionType === "wired" || (!c.wlanId && !c.type)) : [];
  const guestClients = clients.filter(c => c.isGuest);

  const wifiCount = clients.length ? wifiClients.length : counts.wifiClient || 0;
  const wiredCount = clients.length ? wiredClients.length : counts.wiredClient || 0;
  const wifiPct = totalClients ? Math.round((wifiCount / totalClients) * 100) : 0;
  const wiredPct = totalClients ? Math.round((wiredCount / totalClients) * 100) : 0;

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || c.hostname || c.mac || "").toLowerCase().includes(q) || (c.ip || c.ipAddress || "").includes(q);
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Clients
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalClients} connected · {selectedSite.name}</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: totalClients, icon: Users, color: "text-cyan-400" },
          { label: "WiFi", value: wifiCount, icon: Wifi, color: "text-blue-400" },
          { label: "Wired", value: wiredCount, icon: Activity, color: "text-green-400" },
          { label: "Guest", value: clients.length ? guestClients.length : counts.guestClient || 0, icon: UserCheck, color: "text-yellow-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-slate-500">{c.label}</span>
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Breakdown bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Client Breakdown</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: "WiFi", count: wifiCount, pct: wifiPct, color: "bg-blue-500", icon: Wifi, iconColor: "text-blue-400" },
            { label: "Wired", count: wiredCount, pct: wiredPct, color: "bg-green-500", icon: Activity, iconColor: "text-green-400" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <item.icon className={`w-3 h-3 ${item.iconColor}`} /> {item.label}
                </span>
                <span className="text-white font-medium">{item.count} clients ({item.pct}%)</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live client table — Network API */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network API — Live Clients</span>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, IP, MAC..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading clients...
          </div>
        ) : error ? (
          <div className="text-center py-10 text-sm text-red-400">{error}</div>
        ) : !clients.length ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p>No client data from Network API</p>
            <p className="text-xs mt-1 text-slate-600">Requires Cloud Gateway with UniFi OS 4.1.9+</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Client</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">IP</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Connection</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Network</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Signal</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">TX / RX</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id || c.mac || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <div>
                          <div className="text-white text-sm font-medium">{c.name || c.hostname || "Unknown"}</div>
                          {c.mac && <div className="text-xs text-slate-500 font-mono">{c.mac}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs">{c.ip || c.ipAddress || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs">
                        {connectionIcon(c)}
                        <span className="text-slate-300">{c.type || (c.wlanId ? "Wireless" : "Wired")}</span>
                        {c.isGuest && <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Guest</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{c.networkName || c.wlanName || c.vlanId || "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      {c.signal != null ? (
                        <span className={c.signal > -60 ? "text-green-400" : c.signal > -75 ? "text-yellow-400" : "text-red-400"}>
                          {c.signal} dBm
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.txBytes || c.rxBytes ? (
                        <span>{formatBytes(c.txBytes)} / {formatBytes(c.rxBytes)}</span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && search && (
              <div className="text-center py-8 text-slate-500 text-sm">No clients match "{search}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}