import React from "react";
import { AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";

function severityIcon(severity) {
  const s = (severity || "").toLowerCase();
  if (s === "critical" || s === "error") return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
  if (s === "warning" || s === "warn") return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  if (s === "info") return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
}

function severityBg(severity) {
  const s = (severity || "").toLowerCase();
  if (s === "critical" || s === "error") return "border-red-500/30 bg-red-500/5";
  if (s === "warning" || s === "warn") return "border-yellow-500/30 bg-yellow-500/5";
  if (s === "info") return "border-blue-500/30 bg-blue-500/5";
  return "border-green-500/30 bg-green-500/5";
}

export default function AlarmsPanel({ alarms = [] }) {
  if (!alarms.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
        <CheckCircle className="w-8 h-8 text-green-500/40" />
        <span>No active alarms</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
      {alarms.map((alarm, i) => (
        <div key={alarm.id || i} className={`flex gap-3 items-start p-3 rounded-lg border ${severityBg(alarm.severity)}`}>
          {severityIcon(alarm.severity)}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{alarm.message || alarm.type || "Alarm"}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
              {alarm.severity && <span className="uppercase">{alarm.severity}</span>}
              {alarm.datetime && <span>{new Date(alarm.datetime).toLocaleString()}</span>}
              {alarm.key && <span className="text-slate-600">{alarm.key}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}