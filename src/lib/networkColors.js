// Stable palette of distinct colors for per-network/VLAN coloring
const PALETTE = [
  { color: "#06b6d4", dark: "#0e3a45", tailwind: { activeBg: "bg-cyan-600",    border: "border-cyan-500",    text: "text-cyan-300",    ring: "ring-cyan-400"    } },
  { color: "#f472b6", dark: "#3d1127", tailwind: { activeBg: "bg-pink-600",     border: "border-pink-500",    text: "text-pink-300",    ring: "ring-pink-400"    } },
  { color: "#34d399", dark: "#0a2e1f", tailwind: { activeBg: "bg-emerald-600",  border: "border-emerald-500", text: "text-emerald-300", ring: "ring-emerald-400" } },
  { color: "#818cf8", dark: "#1e1b4b", tailwind: { activeBg: "bg-indigo-600",   border: "border-indigo-500",  text: "text-indigo-300",  ring: "ring-indigo-400"  } },
  { color: "#fb923c", dark: "#431407", tailwind: { activeBg: "bg-orange-600",   border: "border-orange-500",  text: "text-orange-300",  ring: "ring-orange-400"  } },
  { color: "#a3e635", dark: "#1a2e05", tailwind: { activeBg: "bg-lime-600",     border: "border-lime-500",    text: "text-lime-300",    ring: "ring-lime-400"    } },
  { color: "#e879f9", dark: "#3b0764", tailwind: { activeBg: "bg-fuchsia-600",  border: "border-fuchsia-500", text: "text-fuchsia-300", ring: "ring-fuchsia-400" } },
  { color: "#38bdf8", dark: "#0c2a3d", tailwind: { activeBg: "bg-sky-600",      border: "border-sky-500",     text: "text-sky-300",     ring: "ring-sky-400"     } },
  { color: "#fbbf24", dark: "#3d2a06", tailwind: { activeBg: "bg-amber-600",    border: "border-amber-500",   text: "text-amber-300",   ring: "ring-amber-400"   } },
  { color: "#f87171", dark: "#450a0a", tailwind: { activeBg: "bg-red-500",      border: "border-red-400",     text: "text-red-300",     ring: "ring-red-400"     } },
  { color: "#4ade80", dark: "#052e16", tailwind: { activeBg: "bg-green-500",    border: "border-green-400",   text: "text-green-300",   ring: "ring-green-400"   } },
  { color: "#c084fc", dark: "#2e1065", tailwind: { activeBg: "bg-purple-500",   border: "border-purple-400",  text: "text-purple-300",  ring: "ring-purple-400"  } },
];

/**
 * Build a stable networkId -> color entry map.
 * Networks are sorted by id for stability across re-renders.
 */
export function buildNetworkColors(networks) {
  const sorted = [...networks].sort((a, b) => (a.id || a._id || "").localeCompare(b.id || b._id || ""));
  const map = {};
  sorted.forEach((net, i) => {
    const entry = PALETTE[i % PALETTE.length];
    const key = net.id || net._id;
    if (key) map[key] = entry;
    if (net._id && net._id !== key) map[net._id] = entry;
    if (net.networkId && net.networkId !== key) map[net.networkId] = entry;
    if (net.networkUUID && net.networkUUID !== key) map[net.networkUUID] = entry;
  });
  return map;
}