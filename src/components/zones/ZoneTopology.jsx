import React, { useState, useMemo } from "react";

// Zone node positions in a 700x320 SVG canvas
const ZONE_LAYOUT = {
  External: { x: 90,  y: 160, color: "#f97316", dark: "#431407", label: "External" },
  Gateway:  { x: 250, y: 160, color: "#22c55e", dark: "#052e16", label: "Gateway" },
  Internal: { x: 460, y: 160, color: "#3b82f6", dark: "#0c1a35", label: "Internal" },
  Vpn:      { x: 150, y: 45,  color: "#a855f7", dark: "#2e1065", label: "VPN" },
  Dmz:      { x: 350, y: 45,  color: "#ef4444", dark: "#450a0a", label: "DMZ" },
  Hotspot:  { x: 580, y: 45,  color: "#eab308", dark: "#422006", label: "Hotspot" },
  Internet: { x: 90,  y: 285, color: "#64748b", dark: "#0f172a", label: "Internet" },
};

const NODE_R = 38;

// Edge style config per action type
function edgeStyle(action, hasBlock, hasAllow) {
  // Mixed (both allow and block rules exist)
  if (hasBlock && hasAllow) {
    return {
      color: "#f59e0b",
      dash: "6,3,2,3",       // dash-dot pattern
      width: 2,
      marker: "mixed",
      label: "MIXED",
      lineType: "dash-dot",
    };
  }
  if (!action) return {
    color: "#334155",
    dash: "2,4",             // dotted
    width: 1.5,
    marker: "neutral",
    label: "No Rule",
    lineType: "dotted",
  };
  if (action.type === "BLOCK") return {
    color: "#ef4444",
    dash: "8,4",             // long dash
    width: 2,
    marker: "block",
    label: "BLOCK",
    lineType: "dashed",
  };
  if (action.type === "ALLOW" && action.allowReturnTraffic) return {
    color: "#22c55e",
    dash: "none",            // solid
    width: 2,
    marker: "allowret",
    label: "ALLOW+RET",
    lineType: "solid",
  };
  // ALLOW only
  return {
    color: "#3b82f6",
    dash: "8,3",             // medium dash
    width: 1.5,
    marker: "allow",
    label: "ALLOW",
    lineType: "long-dash",
  };
}

function curvedPath(x1, y1, x2, y2, curvature = 0.18) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M ${x1} ${y1} Q ${mx - dy * curvature} ${my + dx * curvature} ${x2} ${y2}`;
}

const MARKER_TYPES = ["allowret", "allow", "block", "mixed", "neutral"];
const MARKER_COLORS = {
  allowret: "#22c55e",
  allow: "#3b82f6",
  block: "#ef4444",
  mixed: "#f59e0b",
  neutral: "#334155",
};

export default function ZoneTopology({ zones, policies, networks, selectedNetwork, selectedZone }) {
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // zoneId -> zone
  const zoneById = useMemo(() => {
    const m = {};
    zones.forEach(z => { m[z.id] = z; });
    return m;
  }, [zones]);

  // Build networkId -> zone — try both n.id and n._id
  const networkToZone = useMemo(() => {
    const m = {};
    zones.forEach(z => {
      (z.networkIds || []).forEach(nid => { m[nid] = z; });
    });
    return m;
  }, [zones]);

  // Resolve focus zone from either zone or network selection
  const focusZone = useMemo(() => {
    if (selectedZone) return selectedZone;
    if (selectedNetwork) {
      // Try multiple ID fields the network object might carry
      const ids = [selectedNetwork.id, selectedNetwork._id, selectedNetwork.networkId].filter(Boolean);
      for (const id of ids) {
        if (networkToZone[id]) return networkToZone[id];
      }
      // Fallback: match by name against zone.networkIds resolved names
      return null;
    }
    return null;
  }, [selectedZone, selectedNetwork, networkToZone]);

  // Build edges
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

      const pair = policies.filter(pp =>
        pp.source?.zoneId === srcZ.id && pp.destination?.zoneId === dstZ.id
      );
      const hasBlock = pair.some(pp => pp.action?.type === "BLOCK");
      const hasAllow = pair.some(pp => pp.action?.type === "ALLOW");
      const hasReturn = pair.some(pp => pp.action?.allowReturnTraffic);

      let action = null;
      if (hasBlock && !hasAllow) action = { type: "BLOCK" };
      else if (hasAllow && hasReturn) action = { type: "ALLOW", allowReturnTraffic: true };
      else if (hasAllow) action = { type: "ALLOW" };

      const style = edgeStyle(action, hasBlock, hasAllow);
      result.push({ srcZone: srcZ, dstZone: dstZ, action, style, count: pair.length });
    });
    return result;
  }, [policies, zoneById]);

  const visibleEdges = useMemo(() => {
    if (!focusZone) return edges;
    return edges.filter(e => e.srcZone.id === focusZone.id || e.dstZone.id === focusZone.id);
  }, [edges, focusZone]);

  const knownNames = new Set(Object.keys(ZONE_LAYOUT));
  const renderedZones = zones.filter(z => knownNames.has(z.name));

  function nodePos(name) {
    return ZONE_LAYOUT[name] || { x: 350, y: 160 };
  }

  const LEGEND = [
    { lineType: "solid",     color: "#22c55e", label: "Allow + Return" },
    { lineType: "long-dash", color: "#3b82f6", label: "Allow" },
    { lineType: "dashed",    color: "#ef4444", label: "Block" },
    { lineType: "dash-dot",  color: "#f59e0b", label: "Mixed" },
    { lineType: "dotted",    color: "#475569", label: "No Rule" },
  ];

  function legendDash(lineType) {
    if (lineType === "solid")     return "none";
    if (lineType === "long-dash") return "10,4";
    if (lineType === "dashed")    return "6,3";
    if (lineType === "dash-dot")  return "6,3,2,3";
    if (lineType === "dotted")    return "2,4";
    return "none";
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Traffic Flow Topology</span>
        <span className="text-xs text-slate-600 ml-2">— Select a Zone or VLAN below to highlight its paths</span>
      </div>

      <div className="p-2 sm:p-4">
        <svg viewBox="0 0 700 320" className="w-full" style={{ maxHeight: 300 }}>
          <defs>
            {MARKER_TYPES.map(t => (
              <marker key={t} id={`arr-${t}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={MARKER_COLORS[t]} />
              </marker>
            ))}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {visibleEdges.map((edge, i) => {
            const sp = nodePos(edge.srcZone.name);
            const dp = nodePos(edge.dstZone.name);
            const { color, dash, width, marker, label } = edge.style;
            const isHovered = hoveredEdge === i;
            const isFocused = !!focusZone && (edge.srcZone.id === focusZone.id || edge.dstZone.id === focusZone.id);
            const opacity = focusZone ? (isFocused ? 1 : 0.08) : 0.65;

            // Slight perpendicular offset so bidirectional edges don't perfectly overlap
            const angle = Math.atan2(dp.y - sp.y, dp.x - sp.x);
            const ox = Math.sin(angle) * 5;
            const oy = -Math.cos(angle) * 5;
            const pathD = curvedPath(sp.x + ox, sp.y + oy, dp.x + ox, dp.y + oy);

            // Label position at midpoint of quadratic bezier
            const mx = (sp.x + dp.x) / 2 + ox;
            const my = (sp.y + dp.y) / 2 + oy;
            const ndx = dp.x - sp.x;
            const ndy = dp.y - sp.y;
            const lx = mx - ndy * 0.18 + 4;
            const ly = my + ndx * 0.18 - 6;

            return (
              <g key={i} style={{ opacity }}
                onMouseEnter={() => setHoveredEdge(i)}
                onMouseLeave={() => setHoveredEdge(null)}>
                {/* Wider invisible hit area */}
                <path d={pathD} stroke="transparent" strokeWidth="14" fill="none" style={{ cursor: "pointer" }} />
                <path
                  d={pathD}
                  stroke={color}
                  strokeWidth={isHovered ? width + 1.5 : width}
                  strokeDasharray={dash === "none" ? undefined : dash}
                  fill="none"
                  markerEnd={`url(#arr-${marker})`}
                  filter={isHovered ? "url(#glow)" : undefined}
                />
                {(isHovered || isFocused) && (
                  <text x={lx} y={ly} fill={color} fontSize="8" fontWeight="700" textAnchor="middle"
                    style={{ pointerEvents: "none" }}>
                    {label} ({edge.count})
                  </text>
                )}
              </g>
            );
          })}

          {/* Zone nodes */}
          {renderedZones.map(zone => {
            const pos = nodePos(zone.name);
            const cfg = ZONE_LAYOUT[zone.name];
            const isFocus = focusZone?.id === zone.id;
            const dimmed = focusZone && !isFocus;

            return (
              <g key={zone.id} style={{ opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s" }}>
                {isFocus && (
                  <circle cx={pos.x} cy={pos.y} r={NODE_R + 10} fill={cfg.color} opacity={0.12} />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={NODE_R}
                  fill={cfg.dark}
                  stroke={cfg.color}
                  strokeWidth={isFocus ? 2.5 : 1}
                  opacity={isFocus ? 1 : 0.85}
                  filter={isFocus ? "url(#glow)" : undefined}
                />
                <text x={pos.x} y={pos.y + 5} textAnchor="middle"
                  fill={cfg.color} fontSize="10.5" fontWeight="700"
                  style={{ pointerEvents: "none" }}>
                  {zone.name}
                </text>
              </g>
            );
          })}

          {/* Internet pseudo-node */}
          {(() => {
            const pos = ZONE_LAYOUT.Internet;
            const extPos = ZONE_LAYOUT.External;
            const dim = focusZone && focusZone.name !== "External";
            return (
              <g style={{ opacity: dim ? 0.15 : 0.65, transition: "opacity 0.2s" }}>
                <line x1={pos.x} y1={pos.y - 24} x2={extPos.x} y2={extPos.y + NODE_R}
                  stroke="#475569" strokeWidth="1.5" strokeDasharray="4,3" />
                <circle cx={pos.x} cy={pos.y} r={26} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
                  Internet
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-1 px-2">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <svg width="28" height="10">
                <line x1="0" y1="5" x2="28" y2="5"
                  stroke={l.color} strokeWidth="2"
                  strokeDasharray={legendDash(l.lineType)} />
              </svg>
              <span className="text-xs text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}