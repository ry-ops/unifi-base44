import React from "react";
import { Wifi, Network, Lock } from "lucide-react";

export default function NetworksPanel({ wlans = [], networks = [] }) {
  return (
    <div className="flex flex-col gap-4">
      {wlans.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">WiFi Networks</h4>
          <div className="flex flex-col gap-2">
            {wlans.map((wlan, i) => (
              <div key={wlan.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Wifi className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{wlan.name || wlan.ssid}</div>
                  <div className="text-xs text-slate-500">{wlan.band || ""} {wlan.vlan ? `VLAN ${wlan.vlan}` : ""}</div>
                </div>
                {(wlan.security || wlan.encryption) && (
                  <Lock className="w-3.5 h-3.5 text-yellow-400" />
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${wlan.enabled !== false ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-500"}`}>
                  {wlan.enabled !== false ? "On" : "Off"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {networks.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">VLANs / Networks</h4>
          <div className="flex flex-col gap-2">
            {networks.map((net, i) => (
              <div key={net.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Network className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{net.name}</div>
                  <div className="text-xs text-slate-500">
                    {net.subnet || net.ipSubnet || ""} {net.vlanId ? `VLAN ${net.vlanId}` : ""}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${net.enabled !== false ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-500"}`}>
                  {net.purpose || (net.enabled !== false ? "Active" : "Disabled")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {!wlans.length && !networks.length && (
        <div className="text-center text-slate-500 py-8">No network data</div>
      )}
    </div>
  );
}