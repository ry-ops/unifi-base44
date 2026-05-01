import React from "react";
import { Wifi, Cpu } from "lucide-react";
import { formatUptime } from "@/lib/unifi";

function bar(val, max = 100, color = "bg-blue-500") {
  const pct = Math.min((val / max) * 100, 100);
  const c = pct > 85 ? "bg-red-500" : pct > 60 ? "bg-yellow-500" : color;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-300 w-10 text-right">{val.toFixed(0)}%</span>
    </div>
  );
}

export default function APHealthTable({ devices }) {
  const aps = devices.filter(d => {
    const t = (d.type || d.model || "").toLowerCase();
    return t.includes("uap") || t.includes("ap") || d.type === "uap";
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AP Health</span>
        <span className="ml-auto text-xs text-slate-600">{aps.length} access points</span>
      </div>
      {!aps.length ? (
        <div className="py-10 text-center text-slate-600 text-sm">No AP data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Model</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">State</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium w-32">CPU</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium w-32">Memory</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Clients</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Uptime</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {aps.map((d, i) => {
                const cpu = parseFloat(d["system-stats"]?.cpu ?? d.stat?.ap?.["system-stats"]?.cpu ?? 0);
                const mem = parseFloat(d["system-stats"]?.mem ?? d.stat?.ap?.["system-stats"]?.mem ?? 0);
                const uptime = d.uptime || d.uptimeSecs || 0;
                const clients = d.num_sta ?? d.user_num_sta ?? "—";
                const online = d.state === 1 || (d.state || "").toLowerCase() === "online";
                return (
                  <tr key={d.mac || i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-4 py-2.5 text-white font-medium">{d.name || d.hostname || "AP"}</td>
                    <td className="px-4 py-2.5 text-slate-400">{d.model || d.type || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${online ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {online ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{cpu > 0 ? bar(cpu) : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-2.5">{mem > 0 ? bar(mem, 100, "bg-purple-500") : <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-2.5 text-slate-300">{clients}</td>
                    <td className="px-4 py-2.5 text-slate-400">{formatUptime(uptime)}</td>
                    <td className="px-4 py-2.5 font-mono text-slate-400">{d.ip || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}