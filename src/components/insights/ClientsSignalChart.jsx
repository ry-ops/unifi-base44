import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Signal } from "lucide-react";

const BUCKETS = [
  { label: "Excellent\n≥-60", range: [-Infinity, -60], color: "#22c55e" },
  { label: "Good\n-60–-70", range: [-70, -60], color: "#84cc16" },
  { label: "Fair\n-70–-80", range: [-80, -70], color: "#f59e0b" },
  { label: "Poor\n<-80", range: [-Infinity, -80], color: "#ef4444" },
];

// Fix bucket logic: >= threshold
function getBucket(rssi) {
  if (rssi >= -60) return 0;
  if (rssi >= -70) return 1;
  if (rssi >= -80) return 2;
  return 3;
}

const COLORS = ["#22c55e", "#84cc16", "#f59e0b", "#ef4444"];
const LABELS = ["Excellent\n(≥-60)", "Good\n(-60–-70)", "Fair\n(-70–-80)", "Poor\n(<-80)"];
const SHORT = ["Excellent", "Good", "Fair", "Poor"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <div className="text-slate-300">{label}</div>
      <div className="text-white font-bold">{payload[0].value} clients</div>
    </div>
  );
};

export default function ClientsSignalChart({ clients }) {
  const counts = [0, 0, 0, 0];
  clients.forEach(c => {
    const rssi = c.rssi ?? c.signal;
    if (rssi != null) counts[getBucket(rssi)]++;
  });

  const data = SHORT.map((label, i) => ({ label, count: counts[i], color: COLORS[i] }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Signal className="w-3.5 h-3.5 text-green-400" /> Signal Quality Distribution
      </h3>
      {!clients.length ? (
        <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-between mt-2">
            {data.map((d, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-bold" style={{ color: d.color }}>{d.count}</div>
                <div className="text-xs text-slate-600">{d.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}