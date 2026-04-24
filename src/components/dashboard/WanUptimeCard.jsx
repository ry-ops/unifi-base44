import React, { useState } from "react";
import { Globe, ChevronDown, ChevronUp, Clock, AlertTriangle } from "lucide-react";

export default function WanUptimeCard({ wanUptime, internetIssues = [] }) {
  const [expanded, setExpanded] = useState(false);

  const uptimePct = wanUptime != null ? 100 - wanUptime : null;
  const color = uptimePct == null ? "text-slate-500" : uptimePct >= 99 ? "text-green-400" : uptimePct >= 95 ? "text-yellow-400" : "text-red-400";
  const barColor = uptimePct == null ? "bg-slate-700" : uptimePct >= 99 ? "bg-green-500" : uptimePct >= 95 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-orange-400" /> WAN Uptime
        </h2>
        {internetIssues.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          >
            {internetIssues.length} issue(s)
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      <div className={`text-2xl sm:text-3xl font-bold ${color}`}>
        {uptimePct != null ? `${uptimePct.toFixed(2)}%` : "—"}
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: uptimePct != null ? `${Math.min(uptimePct, 100)}%` : "0%" }}
        />
      </div>

      {expanded && internetIssues.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issues</div>
          {internetIssues.map((issue, i) => (
            <div key={i} className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-yellow-300 font-medium">
                    {issue.type || issue.message || JSON.stringify(issue)}
                  </div>
                  {issue.datetime && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-500/70">
                      <Clock className="w-3 h-3" />
                      {new Date(issue.datetime).toLocaleString()}
                    </div>
                  )}
                  {issue.description && (
                    <div className="text-xs text-yellow-400/70 mt-0.5">{issue.description}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}