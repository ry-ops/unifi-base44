import React from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import StatCard from "@/components/dashboard/StatCard";
import { Server, Users, Wifi, AlertTriangle, Activity, CheckCircle, XCircle, Shield, Router } from "lucide-react";
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
  const wanKeys = Object.keys(wans);
  const totalClients = (counts.wifiClient || 0) + (counts.wiredClient || 0);
  const onlineDevices = (counts.totalDevice || 0) - (counts.offlineDevice || 0);

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
    </div>
  );
}