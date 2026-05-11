import React from "react";
import { Lock } from "lucide-react";

const ZONE_COLORS = {
  Internal: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  External: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  Gateway: "text-green-400 bg-green-500/10 border-green-500/30",
  Vpn: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  Hotspot: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  Dmz: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function ZoneList({ zones, networks }) {
  const networkMap = {};
  networks.forEach(n => { networkMap[n.id] = n.name || n.id; });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zone Definitions</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-800/40">
            <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium w-40">Zone Name</th>
            <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium">Networks / Interfaces</th>
            <th className="text-left px-4 py-2.5 text-xs text-slate-400 font-medium w-24">Type</th>
          </tr>
        </thead>
        <tbody>
          {zones.map(zone => {
            const color = ZONE_COLORS[zone.name] || "text-slate-300 bg-slate-700/20 border-slate-600/30";
            const networkNames = zone.networkIds?.map(id => networkMap[id] || id) || [];
            const isSystem = zone.metadata?.origin === "SYSTEM_DEFINED";
            const configurable = zone.metadata?.configurable !== false;
            return (
              <tr key={zone.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {!configurable && <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                    <span className="font-medium text-white">{zone.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {networkNames.length === 0 ? (
                    <span className="text-slate-600">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {networkNames.map(name => (
                        <span key={name} className={`px-2 py-0.5 rounded border text-xs font-medium ${color}`}>
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${isSystem ? "bg-slate-700 text-slate-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {isSystem ? "System" : "Custom"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}