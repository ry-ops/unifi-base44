import React, { useState, useMemo } from "react";

// Zone layout config — positions in a 800x300 SVG canvas
const ZONE_LAYOUT = {
  External:  { x: 80,  y: 150, color: "#f97316", dark: "#7c2d12", label: "External" },
  Gateway:   { x: 240, y: 150, color: "#22c55e", dark: "#14532d", label: "Gateway" },
  Internal:  { x: 440, y: 150, color: "#3b82f6", dark: "#1e3a5f", label: "Internal" },
  Vpn:       { x: 160, y: 40,  color: "#a855f7", dark: "#4a1d96", label: "VPN" },
  Dmz:       { x: 360, y: 40,  color: "#ef4444", dark: "#7f1d1d", label: "DMZ" },
  Hotspot:   { x: 560, y: 40,  color: "#eab308", dark: "#713f12", label: "Hotspot" },
  Internet:  { x: 80,  y: 270, color: "#64748b", dark: "#1e293b", label: "Internet" },
};

const NODE_R = 36;

function getActionColor(action) {
  if (!action) return "#475569";
  if (action.type === "BLOCK") return "#ef4444";
  if (action.type === "ALLOW" && action.allowReturnTraffic) return "#22c55e";
  if (action.type === "ALLOW") return "#3b82f6";
  return "#475569";
}

function getActionLabel(action) {
  if (!action) return "No Rule";
  if (action.type === "BLOCK") return "BLOCK";
  if (action.type === "ALLOW" && action.allowReturnTraffic) return "ALLOW+RET";
  if (action.type === "ALLOW") return "ALLOW";
  return action.type;
}

// Compute midpoint offset for curved paths
function curvedPath(x1, y1, x2, y2, curve = 0.3) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const nx = -dy * curve;
  const ny = dx * curve;
  return `M ${x1} ${y1} Q ${mx + nx} ${my + ny} ${x2} ${y2}`;
}

export default function ZoneTopology({ zones, policies, networks, selectedNetwork, selectedZone }) {
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Build zoneId -> zone name map
  const zoneById = useMemo(() => {
    const m = {};
    zones.forEach(z => { m[z.id] = z; });
    return m;
  }, [zones]);

  // Build networkId -> zone map
  const networkToZone = useMemo(() => {
    const m = {};
    zones.forEach(z => {
      (z.networkIds || []).forEach(nid => { m[nid] = z; });
    });
    return m;
  }, [zones]);

  // Determine what zones are "active" based on selection
  const activeZoneIds = useMemo(() => {
    if (selectedZone) return new Set([selectedZone.id]);
    if (selectedNetwork) {
      const z = networkToZone[selectedNetwork.id];
      return z ? new Set([z.id]) : new Set();
    }
    return new Set(zones.map(z => z.id));
  }, [selectedZone, selectedNetwork, zones, networkToZone]);

  // Determine which zone the selection belongs to (for highlighting paths)
  const focusZone = useMemo(() => {
    if (selectedZone) return selectedZone;
    if (selectedNetwork) return networkToZone[selectedNetwork.id] || null;
    return null;
  }, [selectedZone, selectedNetwork, networkToZone]);

  // Build edges from policies
  const edges = useMemo(() => {
    const seen = new Set();
    const result = [];
    policies.forEach(p => {
      const srcZ = zoneById[p.source?.zoneId];
      const dstZ = zoneById[p.destination?.zoneId];
      if (!srcZ || !dstZ || srcZ.id === dstZ.id) return;
      const key = `${srcZ.id}->${dstZ.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      // Get dominant action for this zone pair
      const pairPolicies = policies.filter(pp =>
        pp.source?.zoneId === srcZ.id && pp.destination?.zoneId === dstZ.id
      );
      const hasBlock = pairPolicies.some(pp => pp.action?.type === "BLOCK");
      const hasAllow = pairPolicies.some(pp => pp.action?.type === "ALLOW");
      const hasReturn = pairPolicies.some(pp => pp.action?.allowReturnTraffic);

      let action;
      if (hasBlock && !hasAllow) action = { type: "BLOCK" };
      else if (hasAllow && hasReturn) action = { type: "ALLOW", allowReturnTraffic: true };
      else if (hasAllow) action = { type: "ALLOW" };
      else action = null;

      result.push({ srcZone: srcZ, dstZone: dstZ, action, count: pairPolicies.length });
    });
    return result;
  }, [policies, zoneById]);

  // Filter edges to show based on focus zone
  const visibleEdges = useMemo(() => {
    if (!focusZone) return edges;
    return edges.filter(e => e.srcZone.id === focusZone.id || e.dstZone.id === focusZone.id);
  }, [edges, focusZone]);

  // Get node positions
  function nodePos(zoneName) {
    return ZONE_LAYOUT[zoneName] || { x: 400, y: 150 };
  }

  const knownZoneNames = new Set(Object.keys(ZONE_LAYOUT));
  const renderedZones = zones.filter(z => knownZoneNames.has(z.name));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Traffic Flow Topology</span>
        <span className="text-xs text-slate-600 ml-2">— Select a VLAN or Zone below to highlight its traffic paths</span>
      </div>

      <div className="p-4">
        <svg viewBox="0 0 680 310" className="w-full" style={{ maxHeight: 280 }}>
          <defs>
            {["allow", "allowret", "block", "neutral"].map(t => {
              const color = t === "block" ? "#ef4444" : t === "allow" ? "#3b82f6" : t === "allowret" ? "#22c55e" : "#475569";
              return (
                <marker key={t} id={`arrow-${t}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={color} />
                </marker>
              );
            })}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Draw edges */}
          {visibleEdges.map((edge, i) => {
            const sp = nodePos(edge.srcZone.name);
            const dp = nodePos(edge.dstZone.name);
            const color = getActionColor(edge.action);
            const label = getActionLabel(edge.action);
            const markerType = edge.action?.type === "BLOCK" ? "block" : edge.action?.allowReturnTraffic ? "allowret" : edge.action?.type === "ALLOW" ? "allow" : "neutral";
            const isHovered = hoveredEdge === i;
            const isFocused = focusZone && (edge.srcZone.id === focusZone.id || edge.dstZone.id === focusZone.id);
            const opacity = focusZone ? (isFocused ? 1 : 0.1) : 0.6;

            // Offset slightly from center so src/dst lines don't overlap
            const angle = Math.atan2(dp.y - sp.y, dp.x - sp.x);
            const offset = 6;
            const ox = Math.sin(angle) * offset;
            const oy = -Math.cos(angle) * offset;
            const pathD = curvedPath(sp.x + ox, sp.y + oy, dp.x + ox, dp.y + oy, 0.15);

            return (
              <g key={i} style={{ opacity }} onMouseEnter={() => setHoveredEdge(i)} onMouseLeave={() => setHoveredEdge(null)}>
                <path
                  d={pathD}
                  stroke={color}
                  strokeWidth={isHovered || isFocused ? 2.5 : 1.5}
                  fill="none"
                  markerEnd={`url(#arrow-${markerType})`}
                  strokeDasharray={edge.action?.type === "BLOCK" ? "5,3" : "none"}
                  filter={isHovered ? "url(#glow)" : undefined}
                />
                {(isHovered || (isFocused && focusZone)) && (
                  <text
                    x={(sp.x + dp.x) / 2 + ox + 4}
                    y={(sp.y + dp.y) / 2 + oy - 6}
                    fill={color}
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {label} ({edge.count})
                  </text>
                )}
              </g>
            );
          })}

          {/* Draw nodes */}
          {renderedZones.map(zone => {
            const pos = nodePos(zone.name);
            const cfg = ZONE_LAYOUT[zone.name];
            const isActive = activeZoneIds.has(zone.id);
            const isFocus = focusZone?.id === zone.id;

            return (
              <g key={zone.id} style={{ opacity: focusZone && !isFocus ? 0.35 : 1 }}>
                {isFocus && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_R + 8} fill={cfg.color} opacity={0.15} />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_R}
                  fill={cfg.dark}
                  stroke={isFocus ? cfg.color : isActive ? cfg.color + "80" : "#334155"}
                  strokeWidth={isFocus ? 2.5 : 1.5}
                  filter={isFocus ? "url(#glow)" : undefined}
                />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill={cfg.color} fontSize="11" fontWeight="700">
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* Internet node (special, always shown) */}
          {(() => {
            const pos = ZONE_LAYOUT.Internet;
            const extZone = zones.find(z => z.name === "External");
            const extPos = ZONE_LAYOUT.External;
            return (
              <g opacity={focusZone && focusZone.name !== "External" ? 0.2 : 0.7}>
                <line x1={pos.x} y1={pos.y} x2={extPos.x} y2={extPos.y + NODE_R}
                  stroke="#475569" strokeWidth="1.5" strokeDasharray="4,3" />
                <circle cx={pos.x} cy={pos.y} r={24} fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">Internet</text>
              </g>
            );
          })()}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-2 px-2 text-xs text-slate-500">
          {[
            { color: "#22c55e", label: "Allow + Return Traffic" },
            { color: "#3b82f6", label: "Allow" },
            { color: "#ef4444", label: "Block (dashed)" },
            { color: "#475569", label: "No Rule" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}