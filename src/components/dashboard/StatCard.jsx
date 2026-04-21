import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "blue", trend }) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400",
    green: "from-green-500/20 to-green-600/10 border-green-500/30 text-green-400",
    red: "from-red-500/20 to-red-600/10 border-red-500/30 text-red-400",
    yellow: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-3 sm:p-5 flex flex-col gap-1.5 sm:gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider leading-tight">{title}</span>
        {Icon && <Icon className="w-4 h-4 opacity-60 flex-shrink-0" />}
      </div>
      <div className="text-2xl sm:text-2xl font-bold text-white">{value ?? "—"}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      {trend !== undefined && (
        <div className={`text-xs font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}