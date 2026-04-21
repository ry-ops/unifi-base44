import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteAlarms, getSiteFirewallRules, getNetworkSites } from "@/lib/unifi";
import { ShieldAlert, Shield, Zap, AlertTriangle, CheckCircle, Globe, Clock, RefreshCw, List } from "lucide-react";

function AlarmSeverityBadge({ severity }) {
  const s = (severity || "").toLowerCase();
  if (s === "critical") return <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">Critical</span>;
  if (s === "warning") return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400">Warning</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700 text-slate-400">{severity || "Info"}</span>;
}

export default function Security() {
  const { selectedSite } = useNetwork();
  const [alarms, setAlarms] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.hostId && selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);

    let networkSiteId = selectedSite.networkSiteId;
    if (!networkSiteId && selectedSite.hostId) {
      const nsResult = await getNetworkSites(selectedSite.hostId).catch(() => null);
      const nsList = Array.isArray(nsResult?.data?.data) ? nsResult.data.data : [];
      const match = nsList.find(ns => ns.internalReference === selectedSite.meta?.name || nsList.length === 1);
      networkSiteId = match?.id || null;
    }

    const safe = fn => fn().catch(() => null);
    const siteId = networkSiteId || selectedSite.id;
    const [a, fr] = await Promise.all([
      safe(() => getSiteAlarms(selectedSite.hostId, siteId)),
      safe(() => getSiteFirewallRules(selectedSite.hostId, siteId)),
    ]);
    const extract = r => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    setAlarms(extract(a));
    setFirewallRules(extract(fr));
    setLoading(false);
  };

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

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

  const criticalAlarms = alarms.filter(a => (a.severity || "").toLowerCase() === "critical");
  const activeRules = firewallRules.filter(r => r.enabled !== false);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Security
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {alarms.length ? `${alarms.length} alarm(s)` : counts.criticalNotification > 0 ? `${counts.criticalNotification} critical alert(s)` : "No critical alerts"} · {selectedSite.name}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-4 ${(alarms.length ? criticalAlarms.length : counts.criticalNotification) > 0 ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            {(alarms.length ? criticalAlarms.length : counts.criticalNotification) > 0
              ? <AlertTriangle className="w-4 h-4 text-red-400" />
              : <CheckCircle className="w-4 h-4 text-green-400" />}
            <span className="text-xs text-slate-400 font-medium">Critical Alerts</span>
          </div>
          <div className={`text-3xl font-bold ${(alarms.length ? criticalAlarms.length : counts.criticalNotification) > 0 ? "text-red-400" : "text-green-400"}`}>
            {alarms.length ? criticalAlarms.length : (counts.criticalNotification || 0)}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${ipsBg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`w-4 h-4 ${ipsColor}`} />
            <span className="text-xs text-slate-400 font-medium">IPS/IDS Mode</span>
          </div>
          <div className={`text-base font-bold ${ipsColor}`}>{ipsModeLabel}</div>
        </div>

        <div className={`rounded-xl border p-4 ${internetIssues.length > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-green-500/10 border-green-500/30"}`}>
          <div className="flex items-center gap-2 mb-2">
            <Globe className={`w-4 h-4 ${internetIssues.length > 0 ? "text-yellow-400" : "text-green-400"}`} />
            <span className="text-xs text-slate-400 font-medium">Internet Issues</span>
          </div>
          <div className={`text-3xl font-bold ${internetIssues.length > 0 ? "text-yellow-400" : "text-green-400"}`}>{internetIssues.length}</div>
        </div>

        <div className="rounded-xl border bg-slate-900 border-slate-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <List className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400 font-medium">Firewall Rules</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{firewallRules.length}</div>
          {firewallRules.length > 0 && <div className="text-xs text-slate-500 mt-1">{activeRules.length} active</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IPS Details — Site Manager */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> IPS/IDS (Site Manager)
          </h2>
          <div className="flex flex-col">
            {[
              { label: "Mode", value: ipsModeLabel, cls: ipsColor },
              { label: "Signature Type", value: ips.type },
              { label: "Active Rules", value: ips.rulesCount?.toLocaleString() },
              { label: "Signatures Updated", value: rulesUpdated },
              { label: "Gateway Model", value: gateway.shortname },
              { label: "WAN Uptime", value: percentages.wanUptime != null ? `${percentages.wanUptime.toFixed(2)}%` : null },
              { label: "TX Retry Rate", value: percentages.txRetry != null ? `${percentages.txRetry.toFixed(2)}%` : null, warn: percentages.txRetry > 10 },
              { label: "WAN Magic", value: wanMagic.available ? (wanMagic.enabled ? "Enabled" : "Available (off)") : null },
            ].filter(i => i.value).map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className={`text-sm font-medium ${item.cls || (item.warn ? "text-yellow-400" : "text-white")}`}>{item.value}</span>
              </div>
            ))}
          </div>
          {ipsMode === "ids" && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />
              IDS mode detects threats but does not block them.
            </div>
          )}
        </div>

        {/* Alarms — Network API */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Alarms (Network API)
            </h2>
            {alarms.length > 0 && <span className="text-xs text-slate-500">{alarms.length} total</span>}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-slate-500 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : !alarms.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <CheckCircle className="w-8 h-8 mb-3 text-green-500/40" />
              <span className="text-sm text-green-400">No active alarms</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
              {alarms.map((a, i) => (
                <div key={a.id || i} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm text-white">{a.message || a.msg || a.type || "Unknown alarm"}</span>
                    <AlarmSeverityBadge severity={a.severity} />
                  </div>
                  {a.datetime && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(a.datetime).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Firewall Rules — Network API */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" /> Firewall Rules (Network API)
          </h2>
          {firewallRules.length > 0 && <span className="text-xs text-slate-500">{firewallRules.length} rules · {activeRules.length} active</span>}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-slate-500 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : !firewallRules.length ? (
          <div className="text-center py-8 text-slate-500 text-sm">No firewall rules from Network API</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Protocol</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Destination</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {firewallRules.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{r.name || `Rule ${i + 1}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${(r.action?.type || "").toLowerCase() === "allow" ? "bg-green-500/20 text-green-400" : (r.action?.type || "").toLowerCase() === "block" ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-300"}`}>
                        {r.action?.type || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs font-mono">{r.protocol || "all"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.sourceAddress || (typeof r.source === "string" ? r.source : r.source?.zoneId || "any")}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{r.destinationAddress || (typeof r.destination === "string" ? r.destination : r.destination?.zoneId || "any")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.enabled === false ? "bg-slate-700 text-slate-400" : "bg-purple-500/20 text-purple-400"}`}>
                        {r.enabled === false ? "Disabled" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internet issues — Site Manager */}
      {internetIssues.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Internet Issues (Site Manager)
          </h2>
          {internetIssues.map((issue, i) => (
            <div key={i} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 mb-2">
              <div>{issue.type || issue.message || JSON.stringify(issue)}</div>
              {issue.datetime && (
                <div className="flex items-center gap-1 mt-1 text-yellow-500">
                  <Clock className="w-3 h-3" /> {new Date(issue.datetime).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}