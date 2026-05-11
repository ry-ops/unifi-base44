import React, { useState } from "react";

const ZONE_COLORS = {
  Internal: { bg: "bg-blue-600", border: "border-blue-500", text: "text-blue-300", activeBg: "bg-blue-600", ring: "ring-blue-400" },
  External: { bg: "bg-orange-600", border: "border-orange-500", text: "text-orange-300", activeBg: "bg-orange-600", ring: "ring-orange-400" },
  Gateway:  { bg: "bg-green-700", border: "border-green-500", text: "text-green-300", activeBg: "bg-green-700", ring: "ring-green-400" },
  Vpn:      { bg: "bg-purple-700", border: "border-purple-500", text: "text-purple-300", activeBg: "bg-purple-700", ring: "ring-purple-400" },
  Hotspot:  { bg: "bg-yellow-600", border: "border-yellow-500", text: "text-yellow-300", activeBg: "bg-yellow-600", ring: "ring-yellow-400" },
  Dmz:      { bg: "bg-red-700", border: "border-red-500", text: "text-red-300", activeBg: "bg-red-700", ring: "ring-red-400" },
};

const DEFAULT_COLOR = { bg: "bg-slate-700", border: "border-slate-600", text: "text-slate-300", activeBg: "bg-slate-600", ring: "ring-slate-400" };

export default function ZoneNetworkSelector({ zones, networks, selectedZone, selectedNetwork, onSelectZone, onSelectNetwork }) {
  const [mode, setMode] = useState("zones"); // "zones" | "vlans"

  // Map networkId -> zone
  const networkToZone = {};
  zones.forEach(z => {
    (z.networkIds || []).forEach(nid => { networkToZone[nid] = z; });
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Filter by:</span>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {["zones", "vlans"].map(m => (
            <button key={m} onClick={() => { setMode(m); onSelectZone(null); onSelectNetwork(null); }}
              className={`px-3 py-1 text-xs font-semibold capitalize transition-colors ${mode === m ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {m === "vlans" ? "VLANs / Networks" : "Zones"}
            </button>
          ))}
        </div>
        {(selectedZone || selectedNetwork) && (
          <button
            onClick={() => { onSelectZone(null); onSelectNetwork(null); }}
            className="text-xs text-slate-500 hover:text-white transition-colors ml-auto underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Zone buttons */}
      {mode === "zones" && (
        <div className="flex flex-wrap gap-2">
          {zones.map(zone => {
            const c = ZONE_COLORS[zone.name] || DEFAULT_COLOR;
            const isActive = selectedZone?.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => onSelectZone(isActive ? null : zone)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isActive
                    ? `${c.activeBg} ${c.border} text-white ring-2 ${c.ring} ring-offset-1 ring-offset-slate-900 scale-105`
                    : `bg-slate-800 border-slate-700 ${c.text} hover:border-slate-500`
                }`}
              >
                {zone.name}
                {zone.networkIds?.length > 0 && (
                  <span className="ml-1.5 opacity-60">({zone.networkIds.length})</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* VLAN/Network buttons grouped by zone */}
      {mode === "vlans" && (
        <div className="flex flex-col gap-3">
          {zones.filter(z => z.networkIds?.length > 0).map(zone => {
            const c = ZONE_COLORS[zone.name] || DEFAULT_COLOR;
            const zoneNetworks = networks.filter(n => zone.networkIds.includes(n.id));
            if (!zoneNetworks.length) return null;
            return (
              <div key={zone.id}>
                <div className={`text-xs font-semibold mb-1.5 ${c.text} uppercase tracking-wider`}>{zone.name}</div>
                <div className="flex flex-wrap gap-2">
                  {zoneNetworks.map(net => {
                    const isActive = selectedNetwork?.id === net.id;
                    return (
                      <button
                        key={net.id}
                        onClick={() => onSelectNetwork(isActive ? null : net)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isActive
                            ? `${c.activeBg} ${c.border} text-white ring-2 ${c.ring} ring-offset-1 ring-offset-slate-900 scale-105`
                            : `bg-slate-800 ${c.border} opacity-70 ${c.text} hover:opacity-100`
                        }`}
                      >
                        {net.name || net.id}
                        {net.vlanId != null && <span className="ml-1 opacity-60">VLAN {net.vlanId}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}