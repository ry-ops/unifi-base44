import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getIspMetrics } from "@/lib/unifi";
import { RefreshCw, Activity } from "lucide-react";
import { format } from "date-fns";

const RANGES = [
  { label: "1h", type: "5m", duration: "1h" },
  { label: "6h", type: "5m", duration: "6h" },
  { label: "24h", type: "5m", duration: "24h" },
  { label: "7d", type: "1h", duration: "7d" },
];

function formatMbps(val) {
  if (!val) return "0";
  return val >= 1000 ? `${(val / 1000).toFixed(1)}G` : `${val.toFixed(1)}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span style={{ color: p.color }}>●</span>
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-mono">{formatMbps(p.value)} Mbps</span>
        </div>
      ))}
    </div>
  );
};

export default function IspMetricsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState(RANGES[2]);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [range]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIspMetrics(range.type, { duration: range.duration });
      const raw = Array.isArray(result?.data?.data) ? result.data.data : [];

      // Structure: raw[].periods[].{ metricTime, data.wan.{ download_kbps, upload_kbps, avgLatency } }
      const points = [];
      raw.forEach(entry => {
        (entry.periods || []).forEach(p => {
          const ts = p.metricTime || p.timestamp;
          const wan = p.data?.wan || {};
          if (!ts) return;
          points.push({
            time: format(new Date(ts), range.duration === "7d" ? "MM/dd HH:mm" : "HH:mm"),
            download: (wan.download_kbps || 0) / 1000,  // convert to Mbps
            upload: (wan.upload_kbps || 0) / 1000,
            latency: wan.avgLatency || null,
          });
        });
      });

      // Sort by time ascending
      points.sort((a, b) => a.time.localeCompare(b.time));
      setData(points.slice(-120));
    } catch (e) {
      setError("No ISP metrics available");
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          WAN Throughput
          <span className="text-xs font-normal text-slate-500">(Mbps)</span>
        </h2>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex rounded-md overflow-hidden border border-slate-700">
            {RANGES.map(r => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  range.label === r.label
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Loading metrics...
          </div>
        ) : error || !data.length ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-600 text-sm">
            <Activity className="w-8 h-8 mb-2 text-slate-700" />
            {error || "No metrics data for this range"}
            <div className="text-xs mt-1 text-slate-700">ISP metrics require UniFi Cloud connectivity</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
                iconType="circle"
                iconSize={8}
              />
              <Area
                type="monotone"
                dataKey="download"
                name="Download"
                stroke="#3b82f6"
                strokeWidth={1.5}
                fill="url(#gradDown)"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Area
                type="monotone"
                dataKey="upload"
                name="Upload"
                stroke="#22c55e"
                strokeWidth={1.5}
                fill="url(#gradUp)"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}