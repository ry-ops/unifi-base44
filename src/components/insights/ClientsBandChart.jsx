import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Radio } from "lucide-react";

const BANDS = [
  { key: "ng", label: "2.4 GHz", color: "#f59e0b" },
  { key: "na", label: "5 GHz", color: "#3b82f6" },
  { key: "6g", label: "6 GHz", color: "#a78bfa" },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <div className="text-white font-bold">{payload[0].name}</div>
      <div className="text-slate-300">{payload[0].value} clients</div>
    </div>
  );
};

export default function ClientsBandChart({ clients }) {
  const data = BANDS.map(b => ({
    name: b.label,
    value: clients.filter(c => c.radio === b.key).length,
    color: b.color,
  })).filter(d => d.value > 0);

  const total = clients.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-yellow-400" /> Clients / Band
      </h3>
      {!total ? (
        <div className="h-40 flex items-center justify-center text-slate-600 text-sm">No data</div>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {data.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-300">{d.name}</span>
                  </span>
                  <span className="text-white font-bold">{d.value} <span className="text-slate-500 font-normal">({Math.round(d.value / total * 100)}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
                </div>
              </div>
            ))}
            <div className="mt-1 pt-2 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-500">Total WiFi Clients</span>
              <span className="text-white font-bold">{total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}