import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

// Normalize zone name for display — always capitalize DMZ
function displayName(name) {
  if (!name) return name;
  return name.replace(/\bDmz\b/gi, "DMZ").replace(/\bdmz\b/gi, "DMZ").replace(/\bVpn\b/gi, "VPN").replace(/\bvpn\b/gi, "VPN");
}

// Initial node positions
const INITIAL_POSITIONS = {
  External: { x: 90,  y: 160 },
  Gateway:  { x: 260, y: 160 },
  Internal: { x: 460, y: 160 },
  Vpn:      { x: 150, y: 50  },
  Dmz:      { x: 355, y: 50  },
  Hotspot:  { x: 580, y: 50  },
  Internet: { x: 90,  y: 290 },
};

const ZONE_CFG = {
  External: { color: "#f97316", dark: "#431407" },
  Gateway:  { color: "#22c55e", dark: "#052e16" },
  Internal: { color: "#3b82f6", dark: "#0c1a35" },
  Vpn:      { color: "#a855f7", dark: "#2e1065" },
  Dmz:      { color: "#ef4444", dark: "#450a0a" },
  Hotspot:  { color: "#eab308", dark: "#422006" },
  Internet: { color: "#64748b", dark: "#0f172a" },
};

const NODE_R = 38;
const MARKER_TYPES = ["allowret", "allow", "block", "mixed", "neutral"];
const MARKER_COLORS = { allowret: "#22c55e", allow: "#3b82f6", block: "#ef4444", mixed: "#f59e0b", neutral: "#334155" };

function edgeStyle(action, hasBlock, hasAllow) {
  if (hasBlock && hasAllow) return { color: "#f59e0b", dash: "6,3,2,3", width: 2, marker: "mixed",    label: "MIXED",     animated: true };
  if (!action)               return { color: "#334155", dash: "2,4",     width: 1.5, marker: "neutral", label: "No Rule",   animated: false };
  if (action.type === "BLOCK") return { color: "#ef4444", dash: "8,4",   width: 2,   marker: "block",   label: "BLOCK",     animated: true };
  if (action.type === "ALLOW" && action.allowReturnTraffic)
                               return { color: "#22c55e", dash: "none",  width: 2,   marker: "allowret",label: "ALLOW+RET", animated: true };
  return                              { color: "#3b82f6", dash: "8,3",   width: 1.5, marker: "allow",   label: "ALLOW",     animated: true };
}

function curvedPath(x1, y1, x2, y2, curv = 0.18) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  return `M ${x1} ${y1} Q ${mx - dy * curv} ${my + dx * curv} ${x2} ${y2}`;
}

function legendDash(t) {
  return { solid: "none", "long-dash": "10,4", dashed: "6,3", "dash-dot": "6,3,2,3", dotted: "2,4" }[t] || "none";
}

const LEGEND = [
  { lineType: "solid",     color: "#22c55e", label: "Allow + Return" },
  { lineType: "long-dash", color: "#3b82f6", label: "Allow" },
  { lineType: "dashed",    color: "#ef4444", label: "Block" },
  { lineType: "dash-dot",  color: "#f59e0b", label: "Mixed" },
  { lineType: "dotted",    color: "#475569", label: "No Rule" },
];

export default function ZoneTopology({ zones, policies, networks, selectedNetwork, selectedZone }) {
  const svgRef = useRef(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  // Node positions (draggable)
  const [positions, setPositions] = useState({ ...INITIAL_POSITIONS });

  // Zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef(null);
  const dragNode = useRef(null); // { name, startSvgX, startSvgY, startPosX, startPosY }

  // zoneId -> zone
  const zoneById = useMemo(() => {
    const m = {}; zones.forEach(z => { m[z.id] = z; }); return m;
  }, [zones]);

  const networkToZone = useMemo(() => {
    const m = {}; zones.forEach(z => { (z.networkIds || []).forEach(nid => { m[nid] = z; }); }); return m;
  }, [zones]);

  const focusZone = useMemo(() => {
    if (selectedZone) return selectedZone;
    if (selectedNetwork) {
      const ids = [selectedNetwork.id, selectedNetwork._id, selectedNetwork.networkId].filter(Boolean);
      for (const id of ids) if (networkToZone[id]) return networkToZone[id];
    }
    return null;
  }, [selectedZone, selectedNetwork, networkToZone]);

  const edges = useMemo(() => {
    const seen = new Set(), result = [];
    policies.forEach(p => {
      const srcZ = zoneById[p.source?.zoneId], dstZ = zoneById[p.destination?.zoneId];
      if (!srcZ || !dstZ || srcZ.id === dstZ.id) return;
      const key = `${srcZ.id}->${dstZ.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const pair = policies.filter(pp => pp.source?.zoneId === srcZ.id && pp.destination?.zoneId === dstZ.id);
      const hasBlock = pair.some(pp => pp.action?.type === "BLOCK");
      const hasAllow = pair.some(pp => pp.action?.type === "ALLOW");
      const hasReturn = pair.some(pp => pp.action?.allowReturnTraffic);
      let action = null;
      if (hasBlock && !hasAllow) action = { type: "BLOCK" };
      else if (hasAllow && hasReturn) action = { type: "ALLOW", allowReturnTraffic: true };
      else if (hasAllow) action = { type: "ALLOW" };
      result.push({ srcZone: srcZ, dstZone: dstZ, action, style: edgeStyle(action, hasBlock, hasAllow), count: pair.length });
    });
    return result;
  }, [policies, zoneById]);

  const visibleEdges = useMemo(() => {
    if (!focusZone) return edges;
    return edges.filter(e => e.srcZone.id === focusZone.id || e.dstZone.id === focusZone.id);
  }, [edges, focusZone]);

  const knownNames = new Set(Object.keys(INITIAL_POSITIONS));
  const renderedZones = zones.filter(z => knownNames.has(z.name));

  // Convert a mouse/touch event to SVG coordinate space (accounting for zoom/pan)
  function toSvgCoords(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vbW = 700, vbH = 340;
    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;
    // raw SVG coords
    const rawX = (clientX - rect.left) * scaleX;
    const rawY = (clientY - rect.top) * scaleY;
    // invert zoom/pan transform: transform is translate(pan) scale(zoom) around center
    const cx = vbW / 2, cy = vbH / 2;
    const svgX = (rawX - cx - pan.x) / zoom + cx;
    const svgY = (rawY - cy - pan.y) / zoom + cy;
    return { x: svgX, y: svgY };
  }

  // --- Drag node ---
  const onNodeMouseDown = useCallback((e, name) => {
    e.stopPropagation();
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    dragNode.current = { name, startSvgX: x, startSvgY: y, startPosX: positions[name].x, startPosY: positions[name].y };
  }, [positions, pan, zoom]);

  // --- Pan canvas ---
  const onSvgMouseDown = useCallback((e) => {
    if (dragNode.current) return;
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (dragNode.current) {
      const { x, y } = toSvgCoords(e.clientX, e.clientY);
      const { name, startSvgX, startSvgY, startPosX, startPosY } = dragNode.current;
      setPositions(prev => ({
        ...prev,
        [name]: { x: startPosX + (x - startSvgX), y: startPosY + (y - startSvgY) }
      }));
      return;
    }
    if (panStart.current) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      // convert px delta to SVG units
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgDx = (dx / rect.width) * 700;
      const svgDy = (dy / rect.height) * 340;
      setPan({ x: panStart.current.px + svgDx, y: panStart.current.py + svgDy });
    }
  }, [pan, zoom]);

  const onMouseUp = useCallback(() => {
    dragNode.current = null;
    panStart.current = null;
  }, []);

  // Wheel zoom
  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(4, Math.max(0.3, z * delta)));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  function zoomBy(delta) { setZoom(z => Math.min(4, Math.max(0.3, z + delta))); }
  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); setPositions({ ...INITIAL_POSITIONS }); }

  // The inner group transform: scale around center of viewBox
  const VB_CX = 350, VB_CY = 170;
  const transform = `translate(${VB_CX + pan.x} ${VB_CY + pan.y}) scale(${zoom}) translate(${-VB_CX} ${-VB_CY})`;

  function pos(name) { return positions[name] || INITIAL_POSITIONS[name] || { x: 350, y: 170 }; }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Traffic Flow Topology</span>
          <span className="text-xs text-slate-600 ml-2">— Drag nodes · Scroll to zoom · Select a Zone or VLAN to filter</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => zoomBy(0.15)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Zoom in">
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => zoomBy(-0.15)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Zoom out">
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Reset view">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-600 ml-1 font-mono">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 700 340"
          className="w-full rounded-lg"
          style={{ maxHeight: 340, cursor: dragNode.current ? "grabbing" : "grab", userSelect: "none", background: "#0b111e" }}
          onMouseDown={onSvgMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <defs>
            {MARKER_TYPES.map(t => (
              <marker key={t} id={`arr-${t}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={MARKER_COLORS[t]} />
              </marker>
            ))}
            <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Animated flow gradient per edge type */}
            {MARKER_TYPES.filter(t => t !== "neutral").map(t => (
              <linearGradient key={`flow-${t}`} id={`flow-${t}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={MARKER_COLORS[t]} stopOpacity="0" />
                <stop offset="40%" stopColor={MARKER_COLORS[t]} stopOpacity="0.9" />
                <stop offset="100%" stopColor={MARKER_COLORS[t]} stopOpacity="0" />
              </linearGradient>
            ))}
            {/* CSS animations injected inline */}
            <style>{`
              @keyframes flowDash { from { stroke-dashoffset: 40; } to { stroke-dashoffset: 0; } }
              @keyframes flowDashBlock { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 40; } }
              .flow-allow { animation: flowDash 1.4s linear infinite; }
              .flow-allowret { animation: flowDash 1s linear infinite; }
              .flow-block { animation: flowDashBlock 1.2s linear infinite; }
              .flow-mixed { animation: flowDash 0.9s linear infinite; }
              .pulse-node { animation: pulseNode 2s ease-in-out infinite; }
              @keyframes pulseNode { 0%,100% { opacity: 0.12; r: 46px; } 50% { opacity: 0.22; r: 52px; } }
            `}</style>
          </defs>

          <g transform={transform}>
            {/* Edges */}
            {visibleEdges.map((edge, i) => {
              const sp = pos(edge.srcZone.name);
              const dp = pos(edge.dstZone.name);
              if (!sp || !dp) return null;
              const { color, dash, width, marker, label, animated } = edge.style;
              const isHovered = hoveredEdge === i;
              const isFocused = !!focusZone && (edge.srcZone.id === focusZone.id || edge.dstZone.id === focusZone.id);
              const opacity = focusZone ? (isFocused ? 1 : 0.07) : 0.7;

              const angle = Math.atan2(dp.y - sp.y, dp.x - sp.x);
              const ox = Math.sin(angle) * 5, oy = -Math.cos(angle) * 5;
              const pathD = curvedPath(sp.x + ox, sp.y + oy, dp.x + ox, dp.y + oy);

              const mx2 = (sp.x + dp.x) / 2 + ox;
              const my2 = (sp.y + dp.y) / 2 + oy;
              const ndx = dp.x - sp.x, ndy = dp.y - sp.y;
              const lx = mx2 - ndy * 0.18 + 4;
              const ly = my2 + ndx * 0.18 - 7;

              // animated dash offset class
              const animClass = animated ? `flow-${marker}` : "";

              return (
                <g key={`${edge.srcZone.id}-${edge.dstZone.id}`} style={{ opacity }}
                  onMouseEnter={() => setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge(null)}>
                  {/* Hit area */}
                  <path d={pathD} stroke="transparent" strokeWidth="16" fill="none" style={{ cursor: "pointer" }} />
                  {/* Base path */}
                  <path d={pathD} stroke={color} strokeWidth={isHovered ? width + 1.5 : width}
                    strokeDasharray={dash === "none" ? "none" : dash}
                    fill="none"
                    markerEnd={`url(#arr-${marker})`}
                    filter={isHovered ? "url(#glow)" : undefined}
                  />
                  {/* Animated overlay — flowing dots */}
                  {animated && (
                    <path d={pathD}
                      stroke={color}
                      strokeWidth={width + 0.5}
                      strokeDasharray="6,22"
                      strokeDashoffset="0"
                      fill="none"
                      opacity="0.65"
                      className={animClass}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
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
              const p = pos(zone.name);
              const cfg = ZONE_CFG[zone.name] || { color: "#94a3b8", dark: "#1e293b" };
              const isFocus = focusZone?.id === zone.id;
              const dimmed = focusZone && !isFocus;
              const label = displayName(zone.name);

              return (
                <g key={zone.id}
                  style={{ opacity: dimmed ? 0.25 : 1, transition: "opacity 0.2s", cursor: "grab" }}
                  onMouseDown={(e) => onNodeMouseDown(e, zone.name)}>
                  {/* Pulse ring when focused */}
                  {isFocus && (
                    <circle cx={p.x} cy={p.y} r={NODE_R + 10} fill={cfg.color}
                      style={{ animation: "pulseNode 2s ease-in-out infinite" }} opacity={0.15} />
                  )}
                  <circle cx={p.x} cy={p.y} r={NODE_R}
                    fill={cfg.dark}
                    stroke={cfg.color}
                    strokeWidth={isFocus ? 2.5 : 1.2}
                    filter={isFocus ? "url(#glow)" : undefined}
                  />
                  <text x={p.x} y={p.y + 5} textAnchor="middle"
                    fill={cfg.color} fontSize="10" fontWeight="700"
                    style={{ pointerEvents: "none" }}>
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Internet pseudo-node — also draggable */}
            {(() => {
              const p = pos("Internet");
              const extP = pos("External");
              const dim = focusZone && focusZone.name !== "External";
              return (
                <g style={{ opacity: dim ? 0.12 : 0.6, transition: "opacity 0.2s", cursor: "grab" }}
                  onMouseDown={(e) => onNodeMouseDown(e, "Internet")}>
                  <line x1={p.x} y1={p.y - 26} x2={extP.x} y2={extP.y + NODE_R}
                    stroke="#475569" strokeWidth="1.5" strokeDasharray="4,3" />
                  <circle cx={p.x} cy={p.y} r={26} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600"
                    style={{ pointerEvents: "none" }}>
                    Internet
                  </text>
                </g>
              );
            })()}
          </g>
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 px-2">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-2">
              <svg width="28" height="10">
                <line x1="0" y1="5" x2="28" y2="5" stroke={l.color} strokeWidth="2"
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