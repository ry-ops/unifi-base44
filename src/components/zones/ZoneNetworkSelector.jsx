import React, { useState, useMemo } from "react";

const ZONE_COLORS = {
  Internal: { activeBg: "bg-blue-600",   border: "border-blue-500",   text: "text-blue-300",   ring: "ring-blue-400"   },
  External: { activeBg: "bg-orange-600", border: "border-orange-500", text: "text-orange-300", ring: "ring-orange-400" },
  Gateway:  { activeBg: "bg-green-700",  border: "border-green-500",  text: "text-green-300",  ring: "ring-green-400"  },
  Vpn:      { activeBg: "bg-purple-700", border: "border-purple-500", text: "text-purple-300", ring: "ring-purple-400" },
  Hotspot:  { activeBg: "bg-yellow-600", border: "border-yellow-500", text: "text-yellow-300", ring: "ring-yellow-400" },
  Dmz:      { activeBg: "bg-red-700",    border: "border-red-500",    text: "text-red-300",    ring: "ring-red-400"    },
};
const DEFAULT_COLOR = { activeBg: "bg-slate-600", border: "border-slate-600", text: "text-slate-300", ring: "ring-slate-400" };

export default function ZoneNetworkSelector({ zones, networks, selectedZone, selectedNetwork, onSelectZone, onSelectNetwork, networkColors = {} }) {
  const [mode, setMode] = useState("zones");

  const networkToZone = useMemo(() => {
    const m = {};
    zones.forEach(z => {
      (z.networkIds || []).forEach(nid => { m[nid] = z; });
    });
    return m;
  }, [zones]);

  function getNetworkZone(net) {
    const ids = [net.id, net._id, net.networkId].filter(Boolean);
    for (const id of ids) {
      if (networkToZone[id]) return networkToZone[id];
    }
    return null;
  }

  const networksByZone = useMemo(() => {
    const groups = {};
    zones.forEach(z => { groups[z.id] = []; });
    networks.forEach(net => {
      const z = getNetworkZone(net);
      if (z) groups[z.id]?.push(net);
    });
    return groups;
  }, [zones, networks, networkToZone]);

  const hasAnyVlans = networks.length > 0 && zones.some(z => (networksByZone[z.id] || []).length > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      {/* Mode toggle + clear */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Filter by:</span>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {[
            { key: "zones", label: "Zones" },
            { key: "vlans", label: "VLANs / Networks" },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => { setMode(key); onSelectZone(null); onSelectNetwork(null); }}
              className={`px-3 py-1 text-xs font-semibold transition-colors ${mode === key ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
        {(selectedZone || selectedNetwork) && (
          <button onClick={() => { onSelectZone(null); onSelectNetwork(null); }}
            className="text-xs text-slate-500 hover:text-white transition-colors ml-auto underline">
            Clear
          </button>
        )}
      </div>

      {/* Zone buttons */}
      {mode === "zones" && (
        <div className="flex flex-wrap gap-2">
          {zones.map(zone => {
            const c = ZONE_COLORS[zone.name] || DEFAULT_COLOR;
            const isActive = selectedZone?.id === zone.id;
            const netCount = (networksByZone[zone.id] || []).length;
            return (
              <button key={zone.id}
                onClick={() => onSelectZone(isActive ? null : zone)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? `${c.activeBg} ${c.border} text-white ring-2 ${c.ring} ring-offset-1 ring-offset-slate-900 scale-105 shadow-lg`
                    : `bg-slate-800 border-slate-700 ${c.text} hover:border-slate-500 hover:scale-105`
                }`}>
                {zone.name}
                {netCount > 0 && <span className="ml-1.5 opacity-60 font-normal">({netCount} nets)</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* VLAN/Network buttons — same style as zone buttons */}
      {mode === "vlans" && (
        !hasAnyVlans ? (
          <p className="text-xs text-slate-500 italic">No networks with zone assignments found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {zones.flatMap(zone => {
              const nets = networksByZone[zone.id] || [];
              const c = ZONE_COLORS[zone.name] || DEFAULT_COLOR;
              return nets.map(net => {
                const isActive = selectedNetwork?.id === net.id || selectedNetwork?._id === net._id;
                return (
                  <button key={net.id || net._id}
                    onClick={() => onSelectNetwork(isActive ? null : net)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? `${c.activeBg} ${c.border} text-white ring-2 ${c.ring} ring-offset-1 ring-offset-slate-900 scale-105 shadow-lg`
                        : `bg-slate-800 border-slate-700 ${c.text} hover:border-slate-500 hover:scale-105`
                    }`}>
                    {net.name || net.id}
                    {net.vlanId != null && (
                      <span className="ml-1.5 opacity-60 font-normal">VLAN {net.vlanId}</span>
                    )}
                  </button>
                );
              });
            })}
          </div>
        )
      )}
    </div>
  );
}