import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Server } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-300 font-medium mb-0.5">{label}</div>
      <div className="text-white font-bold">{payload[0].value} devices</div>
    </div>
  );
};

export default function DeviceTypeBreakdown({ counts }) {
  const data = [
    { name: "Gateway", value: counts.gatewayDevice || 0, color: "#f59e0b" },
    { name: "WiFi AP", value: counts.wifiDevice || 0, color: "#3b82f6" },
    { name: "Wired", value: counts.wiredDevice || 0, color: "#22c55e" },
    { name: "Other", value: Math.max(0, (counts.totalDevice || 0) - (counts.gatewayDevice || 0) - (counts.wifiDevice || 0) - (counts.wiredDevice || 0)), color: "#6366f1" },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Server className="w-4 h-4 text-purple-400" /> Device Types
      </h2>
      {!data.length ? (
        <div className="h-32 flex items-center justify-center text-slate-600 text-sm">No device data</div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}