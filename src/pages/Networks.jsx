import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteNetworks, getSiteWlans, getSitePortForwarding, getSiteTrafficRoutes, getNetworkSites } from "@/lib/unifi";
import { Wifi, Globe, Network, Shield, RefreshCw, Lock, Unlock, ArrowRight } from "lucide-react";

function SectionHeader({ label }) {
  return (
    <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-800/40">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function EmptyRow({ msg }) {
  return <div className="text-center py-8 text-slate-500 text-sm">{msg}</div>;
}

export default function Networks() {
  const { selectedSite } = useNetwork();
  const [networks, setNetworks] = useState([]);
  const [wlans, setWlans] = useState([]);
  const [portForwarding, setPortForwarding] = useState([]);
  const [trafficRoutes, setTrafficRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
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

    const safe = fn => fn().catch(() => null);
    const siteId = networkSiteId || selectedSite.id;
    const [n, w, pf, tr] = await Promise.all([
      safe(() => getSiteNetworks(selectedSite.hostId, siteId)),
      safe(() => getSiteWlans(selectedSite.hostId, siteId)),
      safe(() => getSitePortForwarding(selectedSite.hostId, siteId)),
      safe(() => getSiteTrafficRoutes(selectedSite.hostId, siteId)),
    ]);
    const extract = r => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    setNetworks(extract(n));
    setWlans(extract(w));
    setPortForwarding(extract(pf));
    setTrafficRoutes(extract(tr));
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  const counts = selectedSite.statistics?.counts || {};
  const gateway = selectedSite.statistics?.gateway || {};
  const wans = selectedSite.statistics?.wans || {};
  const ispInfo = selectedSite.statistics?.ispInfo || {};
  const meta = selectedSite.meta || {};
  const wanKeys = Object.keys(wans);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" /> Networks
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {wlans.length || counts.wifiConfiguration || 0} WiFi · {networks.length || counts.lanConfiguration || 0} LANs · {counts.wanConfiguration || 0} WANs
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary stat cards — Site Manager */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "LANs / VLANs", value: networks.length || counts.lanConfiguration || 0, color: "text-cyan-400" },
          { label: "WAN Connections", value: counts.wanConfiguration || 0, color: "text-orange-400" },
          { label: "WiFi Networks", value: wlans.length || counts.wifiConfiguration || 0, color: "text-blue-400" },
          { label: "Port Forwarding", value: portForwarding.length, color: "text-purple-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* WAN Connections — Site Manager */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <SectionHeader label="WAN Connections (Site Manager)" />
          <div className="p-4">
            {wanKeys.length === 0 ? <EmptyRow msg="No WAN data" /> : (
              <div className="flex flex-col gap-3">
                {wanKeys.map(key => {
                  const w = wans[key];
                  return (
                    <div key={key} className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/40">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono font-bold text-orange-400">{key}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><div className="text-slate-500 mb-0.5">External IP</div><div className="text-white font-mono">{w.externalIp || "—"}</div></div>
                        <div><div className="text-slate-500 mb-0.5">ISP</div><div className="text-white">{w.ispInfo?.name || ispInfo.name || "—"}</div></div>
                        {w.ispInfo?.asn && <div><div className="text-slate-500 mb-0.5">ASN</div><div className="text-white font-mono">AS{w.ispInfo.asn}</div></div>}
                        {w.uptime && <div><div className="text-slate-500 mb-0.5">Uptime</div><div className="text-white">{w.uptime}</div></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* WiFi Networks — Network API */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <SectionHeader label="WiFi Networks (Network API)" />
          {loading ? <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</div>
            : !wlans.length ? <EmptyRow msg="No WiFi data from Network API" />
            : (
              <div className="divide-y divide-slate-800">
                {wlans.map((w, i) => (
                  <div key={w.id || i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wifi className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white font-medium">{w.name || w.ssid || "—"}</div>
                        <div className="text-xs text-slate-500">
                          {w.band || "—"} · VLAN {w.vlanId || "default"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.security || w.securityProtocol ? (
                        <Lock className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-yellow-400" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${w.enabled === false ? "bg-slate-700 text-slate-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {w.enabled === false ? "Disabled" : "Enabled"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* LAN Networks — Network API */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <SectionHeader label="LAN Networks / VLANs (Network API)" />
          {loading ? <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</div>
            : !networks.length ? <EmptyRow msg="No network data from Network API" />
            : (
              <div className="divide-y divide-slate-800">
                {networks.map((n, i) => (
                  <div key={n.id || i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Network className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm text-white font-medium">{n.name || "—"}</div>
                        <div className="text-xs text-slate-500">{n.subnet || n.networkAddress || "—"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {n.vlanId != null && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">VLAN {n.vlanId}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${n.enabled === false ? "bg-slate-700 text-slate-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                        {n.enabled === false ? "Disabled" : n.purpose || "Active"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Port Forwarding — Network API */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <SectionHeader label="Port Forwarding (Network API)" />
          {loading ? <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Loading...</div>
            : !portForwarding.length ? <EmptyRow msg="No port forwarding rules" />
            : (
              <div className="divide-y divide-slate-800">
                {portForwarding.map((r, i) => (
                  <div key={r.id || i} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white font-medium">{r.name || `Rule ${i + 1}`}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.enabled === false ? "bg-slate-700 text-slate-400" : "bg-purple-500/20 text-purple-400"}`}>
                        {r.enabled === false ? "Disabled" : "Active"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>{r.protocol?.toUpperCase() || "TCP"}</span>
                      <span>:{r.forwardingPort || r.portIn || "—"}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{r.forwardIp || r.destinationIp || "—"}:{r.forwardPort || r.portOut || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Gateway info — Site Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <SectionHeader label="Gateway & ISP (Site Manager)" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            { label: "Gateway Model", value: gateway.shortname },
            { label: "Timezone", value: meta.timezone },
            { label: "IPS Mode", value: (gateway.ipsMode || "").toUpperCase() },
            { label: "IPS Rules", value: gateway.ipsSignature?.rulesCount?.toLocaleString() },
            { label: "ISP", value: ispInfo.name },
            { label: "ISP Org", value: ispInfo.organization },
            { label: "ISP ASN", value: ispInfo.asn ? `AS${ispInfo.asn}` : null },
            { label: "WAN Uptime", value: selectedSite.statistics?.percentages?.wanUptime != null ? `${selectedSite.statistics.percentages.wanUptime.toFixed(2)}%` : null },
          ].filter(i => i.value).map(item => (
            <div key={item.label}>
              <div className="text-slate-500 mb-1">{item.label}</div>
              <div className="text-white font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}