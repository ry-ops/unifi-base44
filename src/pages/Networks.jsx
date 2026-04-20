import React from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { Wifi, Globe, Network, Shield, Activity } from "lucide-react";

export default function Networks() {
  const { selectedSite } = useNetwork();

  if (!selectedSite) {
    return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;
  }

  const counts = selectedSite.statistics?.counts || {};
  const gateway = selectedSite.statistics?.gateway || {};
  const wans = selectedSite.statistics?.wans || {};
  const ispInfo = selectedSite.statistics?.ispInfo || {};
  const meta = selectedSite.meta || {};
  const wanKeys = Object.keys(wans);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-400" /> Networks
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {counts.wifiConfiguration || 0} WiFi networks · {counts.lanConfiguration || 0} LANs · {counts.wanConfiguration || 0} WANs
        </p>
      </div>

      {/* Network config summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "LAN Networks", value: counts.lanConfiguration || 0, icon: Network, color: "text-cyan-400" },
          { label: "WAN Connections", value: counts.wanConfiguration || 0, icon: Globe, color: "text-orange-400" },
          { label: "WiFi Networks", value: counts.wifiConfiguration || 0, icon: Wifi, color: "text-blue-400" },
          { label: "WiFi Devices (APs)", value: counts.wifiDevice || 0, icon: Activity, color: "text-purple-400" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WAN connections */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-400" /> WAN Connections
          </h2>
          {wanKeys.length === 0 ? (
            <div className="text-sm text-slate-500 py-4 text-center">No WAN data available</div>
          ) : (
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
                      <div>
                        <div className="text-slate-500 mb-0.5">External IP</div>
                        <div className="text-white font-mono">{w.externalIp || "—"}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-0.5">ISP</div>
                        <div className="text-white">{w.ispInfo?.name || ispInfo.name || "—"}</div>
                      </div>
                      {w.ispInfo?.asn && (
                        <div>
                          <div className="text-slate-500 mb-0.5">ASN</div>
                          <div className="text-white font-mono">AS{w.ispInfo.asn}</div>
                        </div>
                      )}
                      {w.uptime && (
                        <div>
                          <div className="text-slate-500 mb-0.5">Uptime</div>
                          <div className="text-white">{w.uptime}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Site & gateway info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" /> Gateway & Security
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { label: "Gateway Model", value: gateway.shortname || "—" },
              { label: "Timezone", value: meta.timezone || "—" },
              { label: "IPS Mode", value: (gateway.ipsMode || "—").toUpperCase() },
              { label: "IPS Signature Type", value: gateway.ipsSignature?.type || "—" },
              { label: "IPS Rules", value: gateway.ipsSignature?.rulesCount?.toLocaleString() || "—" },
              { label: "ISP", value: ispInfo.name || "—" },
              { label: "ISP Organization", value: ispInfo.organization || "—" },
              { label: "ISP ASN", value: ispInfo.asn ? `AS${ispInfo.asn}` : "—" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                <span className="text-xs text-slate-400">{item.label}</span>
                <span className="text-sm text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}