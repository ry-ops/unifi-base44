import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Radio } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <div className="text-slate-300 mb-1 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-mono">{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function ChannelUtilChart({ devices }) {
  // Build per-AP channel util data from radio_table / radio_table_stats
  const apData = [];
  devices.forEach(d => {
    const name = d.name || d.hostname || "AP";
    const radios = d.radio_table_stats || d.radio_table || [];
    const stats = d.radio_table_stats || [];

    const r24 = stats.find(r => r.name === "ra0" || r.radio === "ng") || radios.find(r => r.radio === "ng");
    const r5 = stats.find(r => r.name === "rai0" || r.radio === "na") || radios.find(r => r.radio === "na");

    if (r24 || r5) {
      apData.push({
        name: name.length > 12 ? name.slice(0, 12) + "…" : name,
        "2.4 GHz": r24?.cu_total ?? r24?.utilization ?? null,
        "5 GHz": r5?.cu_total ?? r5?.utilization ?? null,
      });
    }
  });

  if (!apData.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400" /> Channel Utilization
        </h3>
        <div className="h-32 flex items-center justify-center text-slate-600 text-sm">No channel utilization data</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-cyan-400" /> Channel Utilization per AP
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={apData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} iconSize={8} />
          <Bar dataKey="2.4 GHz" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={30} />
          <Bar dataKey="5 GHz" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}