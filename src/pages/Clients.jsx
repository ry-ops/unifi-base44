import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteClients, getNetworkSites, unifiCall, formatBytes } from "@/lib/unifi";
import { Users, Wifi, Activity, UserCheck, RefreshCw, Search, Monitor, Clock, History } from "lucide-react";

function connectionIcon(client) {
  if (client.type === "WIRELESS") return <Wifi className="w-3.5 h-3.5 text-blue-400" />;
  return <Activity className="w-3.5 h-3.5 text-green-400" />;
}

function timeAgo(ts) {
  if (!ts) return "—";
  const secs = Math.floor(Date.now() / 1000) - ts;
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function Clients() {
  const { selectedSite } = useNetwork();
  const [tab, setTab] = useState("live");
  const [clients, setClients] = useState([]);
  const [knownDevices, setKnownDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedSite?.hostId && selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    setError(null);

    let networkSiteId = selectedSite.networkSiteId;
    if (!networkSiteId && selectedSite.hostId) {
      const nsResult = await getNetworkSites(selectedSite.hostId).catch(() => null);
      const nsList = Array.isArray(nsResult?.data?.data) ? nsResult.data.data : [];
      const match = nsList.find(ns => ns.internalReference === selectedSite.meta?.name || nsList.length === 1);
      networkSiteId = match?.id || null;
    }

    const siteRef = selectedSite?.meta?.name || "default";
    const [liveResult, knownResult] = await Promise.all([
      getSiteClients(selectedSite.hostId, networkSiteId || selectedSite.id).catch(() => null),
      unifiCall("GET", `/v1/connector/consoles/${selectedSite.hostId}/proxy/network/api/s/${siteRef}/rest/user`).catch(() => null),
    ]);

    const liveList = Array.isArray(liveResult?.data?.data) ? liveResult.data.data
      : Array.isArray(liveResult?.data) ? liveResult.data : [];
    setClients(liveList);

    const knownList = Array.isArray(knownResult?.data?.data) ? knownResult.data.data : [];
    setKnownDevices(knownList);
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  const counts = selectedSite.statistics?.counts || {};
  const smTotal = (counts.wifiClient || 0) + (counts.wiredClient || 0);
  const totalClients = clients.length || smTotal;
  const wifiClients = clients.filter(c => c.type === "WIRELESS");
  const wiredClients = clients.filter(c => c.type === "WIRED");
  const guestClients = clients.filter(c => c.isGuest || c.access?.type === "GUEST");

  const wifiCount = clients.length ? wifiClients.length : counts.wifiClient || 0;
  const wiredCount = clients.length ? wiredClients.length : counts.wiredClient || 0;
  const wifiPct = totalClients ? Math.round((wifiCount / totalClients) * 100) : 0;
  const wiredPct = totalClients ? Math.round((wiredCount / totalClients) * 100) : 0;

  const filteredLive = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || c.hostname || "").toLowerCase().includes(q)
      || (c.macAddress || c.mac || "").toLowerCase().includes(q)
      || (c.ipAddress || c.ip || "").includes(q);
  });

  const filteredKnown = knownDevices.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.hostname || c.name || "").toLowerCase().includes(q)
      || (c.mac || "").toLowerCase().includes(q)
      || (c.last_ip || "").includes(q)
      || (c.oui || "").toLowerCase().includes(q)
      || (c.last_connection_network_name || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Clients
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalClients} connected · {knownDevices.length} known · {selectedSite.name}</p>
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

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800 flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              onClick={() => { setTab("live"); setSearch(""); }}
              className={`px-4 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${tab === "live" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              <Monitor className="w-3.5 h-3.5" /> Live Clients
            </button>
            <button
              onClick={() => { setTab("known"); setSearch(""); }}
              className={`px-4 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${tab === "known" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
            >
              <History className="w-3.5 h-3.5" /> Known Devices ({knownDevices.length})
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, IP, MAC..."
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50 w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : tab === "live" ? (
          !clients.length ? (
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
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Connected At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLive.map((c, i) => (
                    <tr key={c.id || c.macAddress || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <div>
                            <div className="text-white text-sm font-medium">{c.name || c.hostname || "Unknown"}</div>
                            {(c.macAddress || c.mac) && <div className="text-xs text-slate-500 font-mono">{c.macAddress || c.mac}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{c.ipAddress || c.ip || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs">
                          {connectionIcon(c)}
                          <span className="text-slate-300">{c.type || "—"}</span>
                          {(c.isGuest || c.access?.type === "GUEST") && <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Guest</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{c.networkName || c.wlanName || "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        {c.signal != null ? (
                          <span className={c.signal > -60 ? "text-green-400" : c.signal > -75 ? "text-yellow-400" : "text-red-400"}>
                            {c.signal} dBm
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {c.connectedAt ? new Date(c.connectedAt).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {filteredLive.length === 0 && search && (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-500 text-sm">No clients match "{search}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Known Devices tab */
          !knownDevices.length ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <History className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No known device history available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Device</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Manufacturer</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Last IP</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Network</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Last AP</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Last Seen</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">First Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKnown.map((d, i) => (
                    <tr key={d._id || d.mac || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{d.hostname || d.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-mono">{d.mac}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{d.oui || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.last_ip || "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{d.last_connection_network_name || "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{d.last_uplink_name || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(d.last_seen)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {d.first_seen ? new Date(d.first_seen * 1000).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                  {filteredKnown.length === 0 && search && (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-500 text-sm">No devices match "{search}"</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}