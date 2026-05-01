import React from "react";
import { Users } from "lucide-react";
import { formatBytes } from "@/lib/unifi";

function signalColor(rssi) {
  if (rssi == null) return "text-slate-600";
  if (rssi >= -60) return "text-green-400";
  if (rssi >= -70) return "text-yellow-400";
  return "text-red-400";
}

function bandLabel(radio) {
  if (radio === "ng") return "2.4G";
  if (radio === "na") return "5G";
  if (radio === "6g") return "6G";
  return radio || "—";
}

export default function TopClientsTable({ clients }) {
  const sorted = [...clients]
    .filter(c => c.tx_bytes || c.rx_bytes)
    .sort((a, b) => ((b.tx_bytes || 0) + (b.rx_bytes || 0)) - ((a.tx_bytes || 0) + (a.rx_bytes || 0)))
    .slice(0, 10);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top WiFi Clients by Usage</span>
      </div>
      {!sorted.length ? (
        <div className="py-10 text-center text-slate-600 text-sm">No client usage data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Client</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Band</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Signal</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">SSID</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">TX</th>
                <th className="text-left px-4 py-2.5 text-slate-400 font-medium">RX</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const rssi = c.rssi ?? c.signal;
                return (
                  <tr key={c._id || c.mac || i} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-4 py-2.5">
                      <div className="text-white font-medium">{c.name || c.hostname || "Unknown"}</div>
                      <div className="text-slate-600 font-mono">{c.mac}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${c.radio === "ng" ? "bg-yellow-500/20 text-yellow-400" : c.radio === "na" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                        {bandLabel(c.radio)}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 font-mono ${signalColor(rssi)}`}>
                      {rssi != null ? `${rssi} dBm` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">{c.essid || "—"}</td>
                    <td className="px-4 py-2.5 text-blue-400 font-mono">{formatBytes(c.tx_bytes)}</td>
                    <td className="px-4 py-2.5 text-green-400 font-mono">{formatBytes(c.rx_bytes)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}