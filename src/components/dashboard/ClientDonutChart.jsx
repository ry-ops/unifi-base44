import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Wifi, Cable, UserCheck } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <span style={{ color: payload[0].payload.color }}>●</span>{" "}
      <span className="text-white font-medium">{payload[0].name}:</span>{" "}
      <span className="text-slate-300">{payload[0].value}</span>
    </div>
  );
};

export default function ClientDonutChart({ counts }) {
  const wifi = counts.wifiClient || 0;
  const wired = counts.wiredClient || 0;
  const guest = counts.guestClient || 0;
  const total = wifi + wired;

  const data = [
    { name: "WiFi", value: wifi, color: "#3b82f6" },
    { name: "Wired", value: wired, color: "#22c55e" },
    ...(guest > 0 ? [{ name: "Guest", value: guest, color: "#f59e0b" }] : []),
  ].filter(d => d.value > 0);

  if (!total) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" /> Client Breakdown
        </h2>
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">No clients</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-cyan-400" /> Client Breakdown
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-xl font-bold text-white">{total}</div>
            <div className="text-xs text-slate-500">total</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {[
            { label: "WiFi", value: wifi, color: "bg-blue-500", icon: Wifi },
            { label: "Wired", value: wired, color: "bg-green-500", icon: Cable },
            ...(guest > 0 ? [{ label: "Guest", value: guest, color: "bg-yellow-500", icon: UserCheck }] : []),
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
              <span className="text-xs text-slate-400 flex-1">{item.label}</span>
              <span className="text-xs font-bold text-white">{item.value}</span>
              <span className="text-xs text-slate-600">({total ? Math.round((item.value / total) * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}