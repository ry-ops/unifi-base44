import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";
import { formatBytes } from "@/lib/unifi";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <div className="text-slate-300 mb-1 font-medium">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-mono">{formatBytes(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrafficChart({ devices }) {
  const data = devices
    .filter(d => d.tx_bytes || d.rx_bytes || d.stat?.ap?.tx_bytes || d.stat?.ap?.rx_bytes)
    .map(d => ({
      name: (d.name || d.hostname || "AP").slice(0, 12),
      TX: d.tx_bytes || d.stat?.ap?.tx_bytes || 0,
      RX: d.rx_bytes || d.stat?.ap?.rx_bytes || 0,
    }))
    .sort((a, b) => (b.TX + b.RX) - (a.TX + a.RX))
    .slice(0, 8);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-green-400" /> Traffic per AP
      </h3>
      {!data.length ? (
        <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No traffic data</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => formatBytes(v)} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} iconSize={8} />
            <Bar dataKey="TX" name="TX (Upload)" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="RX" name="RX (Download)" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}