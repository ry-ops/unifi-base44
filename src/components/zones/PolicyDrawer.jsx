import React from "react";
import { X, ShieldCheck, ShieldX, ArrowRight, ToggleLeft, ToggleRight } from "lucide-react";

function ActionBadge({ action }) {
  const type = action?.type;
  if (type === "BLOCK") return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">BLOCK</span>;
  if (type === "ALLOW") return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
      {action.allowReturnTraffic ? "ALLOW + RETURN" : "ALLOW"}
    </span>
  );
  return <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">{type || "—"}</span>;
}

export default function PolicyDrawer({ srcZone, dstZone, policies, allZones, onClose }) {
  const zoneMap = {};
  allZones.forEach(z => { zoneMap[z.id] = z.name?.replace(/^Dmz$/i, "DMZ") || z.name; });

  const filtered = srcZone && dstZone
    ? policies.filter(p => p.source?.zoneId === srcZone.id && p.destination?.zoneId === dstZone.id)
    : policies;

  const fmt = n => n?.replace(/^Dmz$/i, "DMZ") || n;
  const title = srcZone && dstZone
    ? `${fmt(srcZone.name)} → ${fmt(dstZone.name)}`
    : `All Policies`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Firewall Policies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{title} · {filtered.length} {filtered.length === 1 ? "rule" : "rules"}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
              <ShieldX className="w-8 h-8 mb-3" />
              <span className="text-sm">No policies for this zone pair</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filtered.map((policy, i) => (
                <div key={policy.id || i} className={`px-5 py-4 ${policy.enabled === false ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      {policy.enabled === false
                        ? <ToggleLeft className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        : <ToggleRight className="w-4 h-4 text-green-400 flex-shrink-0" />
                      }
                      <span className="text-sm font-medium text-white truncate">{policy.name || `Policy ${i + 1}`}</span>
                    </div>
                    <ActionBadge action={policy.action} />
                  </div>

                  {/* Source → Destination */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {zoneMap[policy.source?.zoneId] || "?"}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {zoneMap[policy.destination?.zoneId] || "?"}
                    </span>
                    {policy.index != null && (
                      <span className="ml-auto text-slate-600">#{policy.index}</span>
                    )}
                  </div>

                  {/* Traffic filters */}
                  <div className="flex flex-wrap gap-3 text-xs">
                    {policy.source?.trafficFilter?.ipAddressFilter?.items?.length > 0 && (
                      <div>
                        <span className="text-slate-500">Src: </span>
                        <span className="font-mono text-slate-300">
                          {policy.source.trafficFilter.ipAddressFilter.items.map(i => i.value).join(", ")}
                        </span>
                      </div>
                    )}
                    {policy.destination?.trafficFilter?.ipAddressFilter?.items?.length > 0 && (
                      <div>
                        <span className="text-slate-500">Dst: </span>
                        <span className="font-mono text-slate-300">
                          {policy.destination.trafficFilter.ipAddressFilter.items.map(i => i.value).join(", ")}
                        </span>
                      </div>
                    )}
                    {policy.loggingEnabled && (
                      <span className="text-yellow-500/70">Logging on</span>
                    )}
                    {policy.description && (
                      <span className="text-slate-600 italic">{policy.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}