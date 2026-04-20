import React from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Server, Users, Wifi, AlertTriangle, Activity, CheckCircle, XCircle, Shield, Router, Globe, Zap, Network, Lock, TrendingUp, MonitorCheck, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { selectedSite } = useNetwork();

  if (!selectedSite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">No site selected</div>
      </div>
    );
  }

  const counts = selectedSite.statistics?.counts || {};
  const gateway = selectedSite.statistics?.gateway || {};
  const ispInfo = selectedSite.statistics?.ispInfo || {};
  const wans = selectedSite.statistics?.wans || {};
  const percentages = selectedSite.statistics?.percentages || {};
  const internetIssues = selectedSite.statistics?.internetIssues || [];
  const wanKeys = Object.keys(wans);
  const totalClients = (counts.wifiClient || 0) + (counts.wiredClient || 0);
  const onlineDevices = (counts.totalDevice || 0) - (counts.offlineDevice || 0);

  const ipsMode = (gateway.ipsMode || "").toLowerCase();
  const wanUptime = percentages.wanUptime;
  const txRetry = percentages.txRetry;
  const hasPendingUpdates = (counts.pendingUpdateDevice || 0) > 0;
  const hasOfflineDevices = (counts.offlineDevice || 0) > 0;
  const hasCriticalAlerts = (counts.criticalNotification || 0) > 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{selectedSite.name} — Network Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total Devices" value={counts.totalDevice || 0} icon={Server} color="blue" />
        <StatCard title="Online" value={onlineDevices} icon={CheckCircle} color="green" />
        <StatCard title="Offline" value={counts.offlineDevice || 0} icon={XCircle} color={counts.offlineDevice > 0 ? "red" : "green"} />
        <StatCard title="Total Clients" value={totalClients} icon={Users} color="cyan" />
        <StatCard title="WiFi Clients" value={counts.wifiClient || 0} icon={Wifi} color="purple" />
        <StatCard title="Critical Alerts" value={counts.criticalNotification || 0} icon={AlertTriangle} color={counts.criticalNotification > 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Gateway info */}
        <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Router className="w-4 h-4 text-blue-400" /> Gateway
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">Model</div>
              <div className="text-sm font-medium text-white">{gateway.shortname || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">IPS Mode</div>
              <div className="text-sm font-medium text-white uppercase">{gateway.ipsMode || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">IPS Signatures</div>
              <div className="text-sm font-medium text-white">{gateway.ipsSignature?.rulesCount?.toLocaleString() || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">IPS Signature Type</div>
              <div className="text-sm font-medium text-white">{gateway.ipsSignature?.type || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">ISP</div>
              <div className="text-sm font-medium text-white">{ispInfo.name || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">ISP ASN</div>
              <div className="text-sm font-medium text-white">{ispInfo.asn ? `AS${ispInfo.asn}` : "—"}</div>
            </div>
          </div>

          {/* WAN info */}
          {wanKeys.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">WAN Connections</div>
              <div className="flex flex-col gap-3">
                {wanKeys.map(wan => {
                  const w = wans[wan];
                  return (
                    <div key={wan} className="flex items-center gap-4 bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs font-mono text-blue-400 w-12">{wan}</div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div><span className="text-slate-500">IP: </span><span className="text-white">{w.externalIp || "—"}</span></div>
                        <div><span className="text-slate-500">ISP: </span><span className="text-white">{w.ispInfo?.name || "—"}</span></div>
                        {w.uptime && <div><span className="text-slate-500">Uptime: </span><span className="text-white">{w.uptime}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Network summary */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" /> Network Summary
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "LAN Networks", value: counts.lanConfiguration || 0 },
              { label: "WAN Connections", value: counts.wanConfiguration || 0 },
              { label: "WiFi Networks", value: counts.wifiConfiguration || 0 },
              { label: "WiFi Devices (APs)", value: counts.wifiDevice || 0 },
              { label: "Wired Devices", value: counts.wiredDevice || 0 },
              { label: "Gateway Devices", value: counts.gatewayDevice || 0 },
              { label: "Pending Updates", value: counts.pendingUpdateDevice || 0 },
              { label: "Guest Clients", value: counts.guestClient || 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health indicators row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WAN Uptime */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" /> WAN Uptime
            </h2>
            {internetIssues.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">{internetIssues.length} issue(s)</span>
            )}
          </div>
          <div className={`text-3xl font-bold ${wanUptime == null ? "text-slate-500" : wanUptime >= 99 ? "text-green-400" : wanUptime >= 95 ? "text-yellow-400" : "text-red-400"}`}>
            {wanUptime != null ? `${wanUptime.toFixed(2)}%` : "—"}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${wanUptime >= 99 ? "bg-green-500" : wanUptime >= 95 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: wanUptime != null ? `${Math.min(wanUptime, 100)}%` : "0%" }}
            />
          </div>
        </div>

        {/* TX Retry Rate */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> TX Retry Rate
          </h2>
          <div className={`text-3xl font-bold ${txRetry == null ? "text-slate-500" : txRetry <= 5 ? "text-green-400" : txRetry <= 15 ? "text-yellow-400" : "text-red-400"}`}>
            {txRetry != null ? `${txRetry.toFixed(2)}%` : "—"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {txRetry == null ? "No data" : txRetry <= 5 ? "Excellent" : txRetry <= 15 ? "Acceptable — check interference" : "High — investigate RF issues"}
          </div>
        </div>

        {/* IPS/IDS Status */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" /> IPS/IDS
          </h2>
          <div className={`text-lg font-bold ${ipsMode === "ips" ? "text-green-400" : ipsMode === "ids" ? "text-yellow-400" : "text-slate-500"}`}>
            {ipsMode === "ips" ? "IPS — Active Prevention" : ipsMode === "ids" ? "IDS — Detection Only" : ipsMode ? ipsMode.toUpperCase() : "—"}
          </div>
          {gateway.ipsSignature?.rulesCount && (
            <div className="text-xs text-slate-500 mt-1">{gateway.ipsSignature.rulesCount.toLocaleString()} active signatures</div>
          )}
          {ipsMode === "ids" && (
            <div className="mt-2 text-xs text-yellow-400/80">⚠ Detection only — threats not blocked</div>
          )}
        </div>
      </div>

      {/* Alerts / action items */}
      {(hasPendingUpdates || hasOfflineDevices || hasCriticalAlerts) && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Action Required</div>
          <div className="flex flex-wrap gap-3">
            {hasPendingUpdates && (
              <Link to="/devices" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/20 transition-colors">
                <MonitorCheck className="w-4 h-4" />
                {counts.pendingUpdateDevice} device{counts.pendingUpdateDevice > 1 ? "s" : ""} pending update
              </Link>
            )}
            {hasOfflineDevices && (
              <Link to="/devices" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                <WifiOff className="w-4 h-4" />
                {counts.offlineDevice} device{counts.offlineDevice > 1 ? "s" : ""} offline
              </Link>
            )}
            {hasCriticalAlerts && (
              <Link to="/security" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                {counts.criticalNotification} critical alert{counts.criticalNotification > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Client breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" /> Wireless Clients
          </h2>
          <div className="text-3xl font-bold text-white">{counts.wifiClient || 0}</div>
          <div className="text-xs text-slate-500 mt-1">of {totalClients} total clients</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: totalClients ? `${((counts.wifiClient || 0) / totalClients) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" /> Wired Clients
          </h2>
          <div className="text-3xl font-bold text-white">{counts.wiredClient || 0}</div>
          <div className="text-xs text-slate-500 mt-1">of {totalClients} total clients</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: totalClients ? `${((counts.wiredClient || 0) / totalClients) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Devices", desc: "View & manage devices", to: "/devices", icon: Server, color: "text-blue-400" },
          { label: "Clients", desc: "Live connected clients", to: "/clients", icon: Users, color: "text-cyan-400" },
          { label: "Networks", desc: "VLANs, WiFi & WAN", to: "/networks", icon: Network, color: "text-purple-400" },
          { label: "Security", desc: "Firewall & alarms", to: "/security", icon: Lock, color: "text-red-400" },
        ].map(nav => (
          <Link key={nav.to} to={nav.to} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-800/60 transition-colors group">
            <nav.icon className={`w-5 h-5 ${nav.color} mb-2`} />
            <div className="text-sm font-semibold text-white">{nav.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{nav.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}