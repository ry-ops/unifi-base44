import React, { useState } from "react";

const ZONE_HEADER_COLORS = {
  Internal: "bg-blue-600/80 text-white",
  External: "bg-orange-600/80 text-white",
  Gateway: "bg-green-700/80 text-white",
  Vpn: "bg-purple-700/80 text-white",
  Hotspot: "bg-yellow-600/80 text-white",
  Dmz: "bg-red-700/80 text-white",
};

function fmtZoneName(name) {
  if (!name) return name;
  return name.replace(/^Dmz$/i, "DMZ");
}

function getCellSummary(srcZone, dstZone, policies) {
  if (srcZone.id === dstZone.id) return null; // same zone

  const relevant = policies.filter(p =>
    p.source?.zoneId === srcZone.id && p.destination?.zoneId === dstZone.id
  );

  if (relevant.length === 0) return { label: "No Rules", count: 0, color: "bg-slate-800/60 text-slate-500 hover:bg-slate-700/60" };

  const hasBlock = relevant.some(p => p.action?.type === "BLOCK");
  const hasAllow = relevant.some(p => p.action?.type === "ALLOW");
  const hasAllowReturn = relevant.some(p => p.action?.type === "ALLOW" && p.action?.allowReturnTraffic);

  let label, color;
  if (hasBlock && !hasAllow) {
    label = "Block All";
    color = "bg-red-900/70 text-red-300 hover:bg-red-800/70 border border-red-700/50";
  } else if (hasAllow && !hasBlock) {
    label = hasAllowReturn ? "Allow Return" : "Allow All";
    color = "bg-green-900/70 text-green-300 hover:bg-green-800/70 border border-green-700/50";
  } else {
    label = "Mixed";
    color = "bg-yellow-900/70 text-yellow-300 hover:bg-yellow-800/70 border border-yellow-700/50";
  }

  return { label, count: relevant.length, color };
}

export default function ZoneMatrix({ zones, policies, onSelectPair }) {
  const [selectedAll, setSelectedAll] = useState(false);
  const totalPolicies = policies.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zone Matrix</span>
        <span className="text-xs text-slate-600 ml-1">— Click any cell to filter firewall policies</span>
        <button
          onClick={() => { setSelectedAll(true); onSelectPair({ src: null, dst: null, all: true }); }}
          className="ml-auto text-xs px-3 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 transition-colors"
        >
          All Policies ({totalPolicies})
        </button>
      </div>

      <div className="overflow-x-auto p-4">
        {/* Destination label */}
        <div className="flex mb-1">
          <div className="w-32 flex-shrink-0" />
          <div className="flex-1 text-center text-xs text-slate-500 font-medium tracking-wider uppercase mb-1">Destination</div>
        </div>

        <div className="flex">
          {/* Source label (rotated) */}
          <div className="flex-shrink-0 w-8 flex items-center justify-center mr-1">
            <div className="text-xs text-slate-500 font-medium tracking-wider uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Source</div>
          </div>

          <div className="flex-1">
            {/* Header row */}
            <div className="flex gap-1 mb-1">
              <div className="w-32 flex-shrink-0" />
              {zones.map(zone => (
                <div key={zone.id} className={`flex-1 min-w-[90px] text-center text-xs font-semibold py-2 px-1 rounded-t-lg ${ZONE_HEADER_COLORS[zone.name] || "bg-slate-700 text-slate-300"}`}>
                  {fmtZoneName(zone.name)}
                </div>
              ))}
            </div>

            {/* Data rows */}
            {zones.map(srcZone => (
              <div key={srcZone.id} className="flex gap-1 mb-1">
                {/* Row header */}
                <div className={`w-32 flex-shrink-0 flex items-center justify-center text-xs font-semibold py-3 px-2 rounded-l-lg ${ZONE_HEADER_COLORS[srcZone.name] || "bg-slate-700 text-slate-300"}`}>
                  {fmtZoneName(srcZone.name)}
                </div>

                {zones.map(dstZone => {
                  if (srcZone.id === dstZone.id) {
                    return (
                      <div key={dstZone.id} className="flex-1 min-w-[90px] flex items-center justify-center py-3 bg-slate-800/30 rounded text-slate-700 text-xs">
                        —
                      </div>
                    );
                  }
                  const summary = getCellSummary(srcZone, dstZone, policies);
                  return (
                    <button
                      key={dstZone.id}
                      onClick={() => onSelectPair({ src: srcZone, dst: dstZone })}
                      className={`flex-1 min-w-[90px] flex flex-col items-center justify-center py-3 rounded text-xs font-medium transition-all cursor-pointer ${summary?.color || "bg-slate-800/60 text-slate-500 hover:bg-slate-700/60"}`}
                    >
                      <span>{summary?.label || "No Rules"}</span>
                      {summary?.count > 0 && (
                        <span className="text-xs opacity-70 mt-0.5">({summary.count})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}