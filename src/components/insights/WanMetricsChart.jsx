import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Globe } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => {
        const isLatency = p.dataKey === "latency";
        return (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span style={{ color: p.color }}>●</span>
            <span className="text-slate-300">{p.name}:</span>
            <span className="text-white font-mono">{isLatency ? `${p.value}ms` : `${p.value?.toFixed(1)} Mbps`}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function WanMetricsChart({ series }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Globe className="w-3.5 h-3.5 text-orange-400" /> WAN Throughput & Latency (Live Samples)
      </h3>
      {!series.length ? (
        <div className="h-44 flex items-center justify-center text-slate-600 text-sm">Collecting samples — data appears after first refresh cycle</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis yAxisId={0} tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
            <YAxis yAxisId="lat" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}ms`} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} iconSize={8} />
            <Area type="monotone" dataKey="download" name="Download (Mbps)" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gDown)" dot={false} yAxisId={0} />
            <Area type="monotone" dataKey="upload" name="Upload (Mbps)" stroke="#22c55e" strokeWidth={1.5} fill="url(#gUp)" dot={false} yAxisId={0} />
            <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#a78bfa" strokeWidth={1.5} fill="none" dot={false} yAxisId="lat" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}