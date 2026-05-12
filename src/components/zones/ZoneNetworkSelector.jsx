import React, { useState, useMemo } from "react";

const ZONE_COLORS = {
  Internal: { text: "text-blue-400",   activeBorder: "border-blue-400",   inactiveBorder: "border-slate-600" },
  External: { text: "text-orange-400", activeBorder: "border-orange-400", inactiveBorder: "border-slate-600" },
  Gateway:  { text: "text-green-400",  activeBorder: "border-green-400",  inactiveBorder: "border-slate-600" },
  Vpn:      { text: "text-purple-400", activeBorder: "border-purple-400", inactiveBorder: "border-slate-600" },
  Hotspot:  { text: "text-yellow-400", activeBorder: "border-yellow-400", inactiveBorder: "border-slate-600" },
  Dmz:      { text: "text-red-400",    activeBorder: "border-red-400",    inactiveBorder: "border-slate-600" },
};
const DEFAULT_COLOR = { text: "text-slate-300", activeBorder: "border-slate-400", inactiveBorder: "border-slate-600" };

export default function ZoneNetworkSelector({ zones, networks, selectedZone, selectedNetwork, onSelectZone, onSelectNetwork }) {
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
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 bg-slate-900 ${c.text} ${
                  isActive ? `${c.activeBorder} brightness-125` : `${c.inactiveBorder} hover:border-slate-500`
                }`}>
                {zone.name}
                {netCount > 0 && <span className="ml-1.5 opacity-50 font-normal">({netCount} nets)</span>}
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 bg-slate-900 ${c.text} ${
                      isActive ? `${c.activeBorder} brightness-125` : `${c.inactiveBorder} hover:border-slate-500`
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