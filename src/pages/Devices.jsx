import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getHost, getDeviceStatusBg, formatUptime } from "@/lib/unifi";
import { RefreshCw, Server, Wifi, Router, HardDrive } from "lucide-react";

function deviceIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("ap") || t.includes("wifi") || t.includes("uap")) return <Wifi className="w-4 h-4 text-blue-400" />;
  if (t.includes("gateway") || t.includes("ugw") || t.includes("udm")) return <Router className="w-4 h-4 text-green-400" />;
  return <HardDrive className="w-4 h-4 text-slate-400" />;
}

export default function Devices() {
  const { selectedSite } = useNetwork();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selectedSite?.hostId) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const result = await getHost(selectedSite.hostId);
    const hostData = result?.data?.data || result?.data || {};
    const devList = hostData?.reportedState?.devices || [];
    setDevices(devList);
    setLoading(false);
  };

  const counts = selectedSite?.statistics?.counts || {};

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" /> Devices
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {counts.totalDevice || 0} total — {counts.offlineDevice || 0} offline
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gateway", value: counts.gatewayDevice || 0, color: "text-green-400" },
          { label: "WiFi APs", value: counts.wifiDevice || 0, color: "text-blue-400" },
          { label: "Wired Devices", value: counts.wiredDevice || 0, color: "text-cyan-400" },
          { label: "Pending Updates", value: counts.pendingUpdateDevice || 0, color: counts.pendingUpdateDevice > 0 ? "text-yellow-400" : "text-slate-400" },
        ].map(c => (
          <div key={c.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-500 mb-1">{c.label}</div>
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device list */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="text-center text-slate-500 py-16">Loading...</div>
          ) : !devices.length ? (
            <div className="text-center text-slate-500 py-16">
              <Server className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No device details available</p>
              <p className="text-xs mt-1">The Site Manager API provides summary counts only</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Model</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">IP</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, i) => (
                    <tr
                      key={d.id || d.mac || i}
                      onClick={() => setSelected(d)}
                      className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selected?.id === d.id ? "bg-blue-600/10" : "hover:bg-slate-800/40"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {deviceIcon(d.model || d.type)}
                          <div>
                            <div className="text-white font-medium">{d.name || d.hostname || "Unknown"}</div>
                            <div className="text-xs text-slate-500 font-mono">{d.mac}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{d.model || d.shortname || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.ip || d.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeviceStatusBg(d.state || d.status || "online")}`}>
                          {d.state || d.status || "Online"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatUptime(d.uptime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device detail */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          {selected ? (
            <div>
              <h3 className="font-semibold text-white mb-4">{selected.name || "Device Details"}</h3>
              <div className="flex flex-col gap-3 overflow-y-auto max-h-96">
                {Object.entries(selected).map(([k, v]) => {
                  if (typeof v === "object" || v === null || v === undefined) return null;
                  return (
                    <div key={k} className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">{k}</span>
                      <span className="text-sm text-slate-200 font-mono break-all">{String(v)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm">
              {devices.length ? "Click a device to view details" : (
                <div>
                  <div className="font-medium text-slate-400 mb-2">Device Summary</div>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between"><span>Gateway</span><span className="text-white">{counts.gatewayDevice || 0}</span></div>
                    <div className="flex justify-between"><span>WiFi APs</span><span className="text-white">{counts.wifiDevice || 0}</span></div>
                    <div className="flex justify-between"><span>Wired</span><span className="text-white">{counts.wiredDevice || 0}</span></div>
                    <div className="flex justify-between"><span>Offline</span><span className={counts.offlineDevice > 0 ? "text-red-400" : "text-green-400"}>{counts.offlineDevice || 0}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}