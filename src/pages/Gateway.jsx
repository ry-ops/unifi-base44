import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { unifiCall, formatBytes, formatUptime } from "@/lib/unifi";
import { Router, RefreshCw, Cpu, Database, Globe, Shield, Wifi, Activity, Clock } from "lucide-react";

function StatusDot({ ok }) {
  return ok
    ? <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
    : <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />;
}

function GaugeBar({ value, color }) {
  const c = value > 85 ? "bg-red-500" : value > 60 ? "bg-yellow-500" : color || "bg-blue-500";
  return (
    <div className="h-2 rounded-full bg-slate-800 overflow-hidden mt-1">
      <div className={`h-full rounded-full transition-all ${c}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function Gateway() {
  const { selectedSite } = useNetwork();
  const [health, setHealth] = useState(null);
  const [sysinfo, setSysinfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.hostId) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const hostId = selectedSite.hostId;
    const siteRef = selectedSite?.meta?.name || "default";
    const base = `/v1/connector/consoles/${hostId}/proxy/network/api/s/${siteRef}`;
    const [h, s] = await Promise.all([
      unifiCall("GET", `${base}/stat/health`).catch(() => null),
      unifiCall("GET", `${base}/stat/sysinfo`).catch(() => null),
    ]);
    const healthList = Array.isArray(h?.data?.data) ? h.data.data : [];
    setHealth(healthList);
    setSysinfo(Array.isArray(s?.data?.data) ? s.data.data[0] : null);
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  const wan = health?.find(h => h.subsystem === "wan") || {};
  const wlan = health?.find(h => h.subsystem === "wlan") || {};
  const lan = health?.find(h => h.subsystem === "lan") || {};
  const vpn = health?.find(h => h.subsystem === "vpn") || {};

  const cpu = parseFloat(wan["gw_system-stats"]?.cpu || 0);
  const mem = parseFloat(wan["gw_system-stats"]?.mem || 0);
  const gwUptime = parseInt(wan["gw_system-stats"]?.uptime || 0);

  const monitors = wan.uptime_stats?.WAN?.alerting_monitors || wan.uptime_stats?.WAN?.monitors || [];

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Router className="w-5 h-5 text-green-400" /> Gateway
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {wan.gw_name || sysinfo?.name || "Dream Machine Pro"} · {selectedSite.name}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !health ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {/* Top stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* CPU */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-500">CPU Usage</span>
              </div>
              <div className={`text-2xl font-bold ${cpu > 85 ? "text-red-400" : cpu > 60 ? "text-yellow-400" : "text-blue-400"}`}>
                {cpu ? `${cpu.toFixed(1)}%` : "—"}
              </div>
              {cpu > 0 && <GaugeBar value={cpu} color="bg-blue-500" />}
            </div>

            {/* Memory */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-500">Memory Usage</span>
              </div>
              <div className={`text-2xl font-bold ${mem > 90 ? "text-red-400" : mem > 75 ? "text-yellow-400" : "text-purple-400"}`}>
                {mem ? `${mem.toFixed(1)}%` : "—"}
              </div>
              {mem > 0 && <GaugeBar value={mem} color="bg-purple-500" />}
            </div>

            {/* Uptime */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-500">Uptime</span>
              </div>
              <div className="text-2xl font-bold text-cyan-400">{gwUptime ? formatUptime(gwUptime) : "—"}</div>
            </div>

            {/* WAN IP */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-slate-500">WAN IP</span>
              </div>
              <div className="text-sm font-bold text-orange-400 font-mono break-all">{wan.wan_ip || "—"}</div>
              {wan.isp_name && <div className="text-xs text-slate-500 mt-1">{wan.isp_name}</div>}
            </div>
          </div>

          {/* Subsystem health + WAN monitors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subsystem status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" /> Subsystem Health
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "WAN", sub: wan, icon: Globe, extra: wan.wan_ip },
                  { label: "WLAN", sub: wlan, icon: Wifi, extra: wlan.num_ap ? `${wlan.num_ap} APs · ${wlan.num_user || 0} users` : null },
                  { label: "LAN", sub: lan, icon: Activity, extra: lan.num_user ? `${lan.num_user} clients` : null },
                  { label: "VPN", sub: vpn, icon: Shield, extra: vpn.num_user ? `${vpn.num_user} tunnels` : null },
                ].filter(s => s.sub && s.sub.subsystem).map(({ label, sub, icon: Icon, extra }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0">
                    <div className="flex items-center gap-3">
                      <StatusDot ok={sub.status === "ok"} />
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {extra && <span>{extra}</span>}
                      <span className={sub.status === "ok" ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                        {sub.status?.toUpperCase() || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-time throughput */}
              {(wan["tx_bytes-r"] || wan["rx_bytes-r"]) && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Throughput</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">TX (upload)</div>
                      <div className="text-sm font-mono text-blue-400">{formatBytes(wan["tx_bytes-r"])}/s</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">RX (download)</div>
                      <div className="text-sm font-mono text-green-400">{formatBytes(wan["rx_bytes-r"])}/s</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WAN monitors */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> WAN Connectivity Monitors
              </h2>
              {monitors.length === 0 ? (
                <div className="text-slate-500 text-sm text-center py-8">No monitor data available</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {monitors.map((m, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusDot ok={m.availability >= 99} />
                          <span className="text-sm text-white font-mono">{m.target}</span>
                          <span className="text-xs text-slate-500 uppercase">{m.type}</span>
                        </div>
                        <span className={`text-xs font-bold ${m.availability >= 99 ? "text-green-400" : m.availability >= 95 ? "text-yellow-400" : "text-red-400"}`}>
                          {m.availability?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Avg latency: <span className="text-white font-mono">{m.latency_average}ms</span></span>
                      </div>
                      <GaugeBar value={m.availability} color="bg-green-500" />
                    </div>
                  ))}
                </div>
              )}

              {/* DNS servers */}
              {wan.nameservers?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">DNS Servers</div>
                  <div className="flex flex-wrap gap-2">
                    {wan.nameservers.map((ns, i) => (
                      <span key={i} className="text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">{ns}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System info */}
          {sysinfo && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">

              {/* System Information */}
              <div>
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Router className="w-4 h-4 text-green-400" /> System Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Hostname", value: sysinfo.hostname },
                    { label: "Model", value: sysinfo.ubnt_device_type },
                    { label: "Controller Version", value: sysinfo.version },
                    { label: "Firmware", value: sysinfo.udm_version?.split(".").slice(0, 3).join(".") },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label}>
                      <div className="text-xs text-slate-500 mb-0.5">{item.label}</div>
                      <div className="text-sm font-medium text-white break-all">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WAN / ISP Information */}
              {(wan.isp_name || wan.isp_organization || wan.asn || wan.netmask) && (
                <div className="pt-5 border-t border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">WAN / ISP Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "ISP", value: wan.isp_name },
                      { label: "ISP Organization", value: wan.isp_organization },
                      { label: "ASN", value: wan.asn ? `AS${wan.asn}` : null },
                      { label: "WAN Netmask", value: wan.netmask },
                    ].filter(i => i.value).map(item => (
                      <div key={item.label}>
                        <div className="text-xs text-slate-500 mb-0.5">{item.label}</div>
                        <div className="text-sm font-medium text-white break-all font-mono">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layer-3 Interfaces */}
              {sysinfo.ip_addrs?.length > 0 && (() => {
                const svIs = sysinfo.ip_addrs.filter(ip => ip.endsWith(".1"));
                const others = sysinfo.ip_addrs.filter(ip => !ip.endsWith(".1"));
                return (
                  <div className="pt-5 border-t border-slate-800 flex flex-col gap-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Layer-3 Interfaces</h3>

                    {svIs.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                          VLAN Default Gateways (SVIs)
                          <span className="text-slate-600 ml-1">— exit interfaces for their respective VLANs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {svIs.map((ip, i) => (
                            <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">{ip}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {others.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                          Router Interface Addresses
                          <span className="text-slate-600 ml-1">— management, secondary, VPN, or internal routing IPs</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {others.map((ip, i) => (
                            <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">{ip}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}