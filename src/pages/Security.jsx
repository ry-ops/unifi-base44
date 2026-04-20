import React from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { ShieldAlert, Shield, Zap, AlertTriangle, CheckCircle, Globe, Clock } from "lucide-react";

export default function Security() {
  const { selectedSite } = useNetwork();

  if (!selectedSite) {
    return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;
  }

  const counts = selectedSite.statistics?.counts || {};
  const gateway = selectedSite.statistics?.gateway || {};
  const internetIssues = selectedSite.statistics?.internetIssues || [];
  const ips = gateway.ipsSignature || {};
  const wanMagic = selectedSite.statistics?.wanMagic || {};
  const percentages = selectedSite.statistics?.percentages || {};

  const ipsMode = (gateway.ipsMode || "").toLowerCase();
  const ipsModeLabel = ipsMode === "ids" ? "IDS (Detection Only)" : ipsMode === "ips" ? "IPS (Active Prevention)" : ipsMode || "—";
  const ipsColor = ipsMode === "ips" ? "text-green-400" : ipsMode === "ids" ? "text-yellow-400" : "text-slate-400";
  const ipsBg = ipsMode === "ips" ? "bg-green-500/20 border-green-500/30" : ipsMode === "ids" ? "bg-yellow-500/20 border-yellow-500/30" : "bg-slate-800 border-slate-700";

  const rulesUpdated = ips.rulesUpdatedAt ? new Date(ips.rulesUpdatedAt).toLocaleDateString() : null;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400" /> Security
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {counts.criticalNotification > 0 ? `${counts.criticalNotification} critical notification(s)` : "No critical alerts"} · {selectedSite.name}
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-xl border p-5 ${counts.criticalNotification > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
          <div className="flex items-center gap-2 mb-3">
            {counts.criticalNotification > 0
              ? <AlertTriangle className="w-4 h-4 text-red-400" />
              : <CheckCircle className="w-4 h-4 text-green-400" />}
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Critical Alerts</span>
          </div>
          <div className={`text-4xl font-bold ${counts.criticalNotification > 0 ? "text-red-400" : "text-green-400"}`}>
            {counts.criticalNotification || 0}
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${ipsBg}`}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className={`w-4 h-4 ${ipsColor}`} />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">IPS/IDS Mode</span>
          </div>
          <div className={`text-lg font-bold ${ipsColor}`}>{ipsModeLabel}</div>
        </div>

        <div className={`rounded-xl border p-5 ${internetIssues.length > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Globe className={`w-4 h-4 ${internetIssues.length > 0 ? "text-yellow-400" : "text-green-400"}`} />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Internet Issues</span>
          </div>
          <div className={`text-4xl font-bold ${internetIssues.length > 0 ? "text-yellow-400" : "text-green-400"}`}>
            {internetIssues.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IPS Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Intrusion Detection/Prevention
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "Mode", value: ipsModeLabel, className: ipsColor },
              { label: "Signature Type", value: ips.type || "—" },
              { label: "Active Rules", value: ips.rulesCount?.toLocaleString() || "—" },
              { label: "Signatures Updated", value: rulesUpdated || "—" },
              { label: "Gateway Model", value: gateway.shortname || "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className={`text-sm font-medium ${item.className || "text-white"}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {ipsMode === "ids" && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
              IDS mode detects threats but does not block them. Switch to IPS mode in your UniFi controller for active prevention.
            </div>
          )}
        </div>

        {/* WAN & connectivity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> WAN & Connectivity
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "WAN Uptime", value: percentages.wanUptime != null ? `${percentages.wanUptime.toFixed(2)}%` : "—" },
              { label: "TX Retry Rate", value: percentages.txRetry != null ? `${percentages.txRetry.toFixed(2)}%` : "—", warn: percentages.txRetry > 10 },
              { label: "WAN Magic", value: wanMagic.available ? (wanMagic.enabled ? "Enabled" : "Available (Disabled)") : "Not Available" },
              { label: "Offline Devices", value: counts.offlineDevice || 0, warn: counts.offlineDevice > 0 },
              { label: "Offline Gateway", value: counts.offlineGatewayDevice || 0, warn: counts.offlineGatewayDevice > 0 },
              { label: "Offline APs", value: counts.offlineWifiDevice || 0, warn: counts.offlineWifiDevice > 0 },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className={`text-sm font-medium ${item.warn ? "text-yellow-400" : "text-white"}`}>{String(item.value)}</span>
              </div>
            ))}
          </div>

          {internetIssues.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" /> Internet Issues
              </div>
              {internetIssues.map((issue, i) => (
                <div key={i} className="p-2.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-2">
                  <div>{issue.type || issue.message || JSON.stringify(issue)}</div>
                  {issue.datetime && (
                    <div className="flex items-center gap-1 mt-1 text-yellow-500">
                      <Clock className="w-3 h-3" />
                      {new Date(issue.datetime).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}