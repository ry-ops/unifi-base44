import React from "react";
import { getDeviceStatusBg, formatUptime } from "@/lib/unifi";
import { Cpu, Wifi, Router, Shield, HardDrive } from "lucide-react";

function deviceIcon(type) {
  if (!type) return <Cpu className="w-4 h-4" />;
  const t = type.toLowerCase();
  if (t.includes("ap") || t.includes("access")) return <Wifi className="w-4 h-4 text-blue-400" />;
  if (t.includes("switch") || t.includes("usw")) return <HardDrive className="w-4 h-4 text-purple-400" />;
  if (t.includes("gateway") || t.includes("router") || t.includes("udm") || t.includes("ugw")) return <Router className="w-4 h-4 text-green-400" />;
  if (t.includes("protect") || t.includes("camera")) return <Shield className="w-4 h-4 text-yellow-400" />;
  return <Cpu className="w-4 h-4 text-slate-400" />;
}

export default function DevicesTable({ devices = [], onAction }) {
  if (!devices.length) {
    return <div className="text-center text-slate-500 py-12">No devices found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-slate-700/50">
            <th className="pb-3 pr-4 text-slate-400 font-medium">Device</th>
            <th className="pb-3 pr-4 text-slate-400 font-medium">Model</th>
            <th className="pb-3 pr-4 text-slate-400 font-medium">IP</th>
            <th className="pb-3 pr-4 text-slate-400 font-medium">Status</th>
            <th className="pb-3 pr-4 text-slate-400 font-medium">Uptime</th>
            <th className="pb-3 text-slate-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device, i) => (
            <tr key={device.id || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  {deviceIcon(device.type || device.model)}
                  <div>
                    <div className="text-white font-medium">{device.name || device.hostname || "Unknown"}</div>
                    <div className="text-slate-500 text-xs">{device.mac}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-slate-300">{device.model || device.type || "—"}</td>
              <td className="py-3 pr-4 text-slate-300 font-mono text-xs">{device.ip || device.ipAddress || "—"}</td>
              <td className="py-3 pr-4">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeviceStatusBg(device.state || device.status)}`}>
                  {device.state || device.status || "Unknown"}
                </span>
              </td>
              <td className="py-3 pr-4 text-slate-400 text-xs">{formatUptime(device.uptime)}</td>
              <td className="py-3">
                <button
                  onClick={() => onAction && onAction("restart", device)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  Restart
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}