import React from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { ShieldCheck } from "lucide-react";

function computeHealthScore({ counts, percentages, gateway }) {
  let score = 100;
  const notes = [];

  const total = counts.totalDevice || 0;
  const offline = counts.offlineDevice || 0;
  const pending = counts.pendingUpdateDevice || 0;
  const critical = counts.criticalNotification || 0;
  const wanUptime = percentages?.wanUptime;
  const txRetry = percentages?.txRetry;
  const ipsMode = (gateway?.ipsMode || "").toLowerCase();

  if (total > 0 && offline > 0) {
    const pct = (offline / total) * 100;
    score -= Math.min(30, pct * 3);
    notes.push(`${offline} device(s) offline`);
  }
  if (critical > 0) {
    score -= Math.min(25, critical * 8);
    notes.push(`${critical} critical alert(s)`);
  }
  if (pending > 0) {
    score -= Math.min(10, pending * 2);
    notes.push(`${pending} update(s) pending`);
  }
  if (wanUptime != null && wanUptime < 99) {
    score -= Math.min(20, (99 - wanUptime) * 4);
    notes.push(`WAN uptime ${wanUptime.toFixed(1)}%`);
  }
  if (txRetry != null && txRetry > 10) {
    score -= Math.min(10, (txRetry - 10) * 1);
    notes.push(`High TX retry (${txRetry.toFixed(1)}%)`);
  }
  if (ipsMode === "ids") {
    score -= 5;
    notes.push("IDS mode — threats not blocked");
  }
  if (ipsMode === "" || ipsMode === "disabled") {
    score -= 10;
    notes.push("IPS/IDS disabled");
  }

  score = Math.max(0, Math.round(score));

  let label, color;
  if (score >= 90) { label = "Excellent"; color = "#22c55e"; }
  else if (score >= 75) { label = "Good"; color = "#84cc16"; }
  else if (score >= 55) { label = "Fair"; color = "#f59e0b"; }
  else if (score >= 35) { label = "Poor"; color = "#f97316"; }
  else { label = "Critical"; color = "#ef4444"; }

  return { score, label, color, notes };
}

export default function DeviceHealthGauge({ statistics }) {
  const counts = statistics?.counts || {};
  const percentages = statistics?.percentages || {};
  const gateway = statistics?.gateway || {};

  const { score, label, color, notes } = computeHealthScore({ counts, percentages, gateway });

  const chartData = [{ name: "health", value: score, fill: color }];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-green-400" /> Network Health Score
      </h2>
      <div className="flex items-center gap-4">
        {/* Gauge */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={52}
              barSize={10}
              data={chartData}
              startAngle={225}
              endAngle={-45}
            >
              {/* Background track */}
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                background={{ fill: "#1e293b" }}
                data={[{ value: 100, fill: "#1e293b" }]}
              />
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                data={chartData}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-2xl font-bold" style={{ color }}>{score}</div>
            <div className="text-xs" style={{ color }}>{label}</div>
          </div>
        </div>

        {/* Issues list */}
        <div className="flex-1 min-w-0">
          {notes.length === 0 ? (
            <div className="text-xs text-green-400">All systems nominal</div>
          ) : (
            <div className="flex flex-col gap-1">
              {notes.map((n, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <span className="text-yellow-500 flex-shrink-0 mt-0.5">▸</span>
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}