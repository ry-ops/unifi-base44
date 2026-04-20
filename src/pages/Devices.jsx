import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteDevices, unifiCall, getDeviceStatusBg, formatUptime, formatBytes } from "@/lib/unifi";
import { RefreshCw, Server } from "lucide-react";

export default function Devices() {
  const { selectedSite } = useNetwork();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const result = await getSiteDevices(selectedSite.id);
    const arr = Array.isArray(result?.data?.data) ? result.data.data :
                Array.isArray(result?.data) ? result.data : [];
    setDevices(arr);
    setLoading(false);
  };

  const handleRestart = async (device) => {
    if (!confirm(`Restart ${device.name || device.mac}?`)) return;
    await unifiCall("POST", `/v1/sites/${selectedSite.id}/devices/${device.id}/restart`);
    alert("Restart command sent.");
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Server className="w-5 h-5 text-blue-400" /> Devices</h1>
          <p className="text-sm text-slate-500 mt-0.5">{devices.length} devices</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Device list */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="text-center text-slate-500 py-16">Loading...</div>
          ) : !devices.length ? (
            <div className="text-center text-slate-500 py-16">No devices found</div>
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
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, i) => (
                    <tr
                      key={d.id || i}
                      onClick={() => setSelected(d)}
                      className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selected?.id === d.id ? "bg-blue-600/10" : "hover:bg-slate-800/40"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{d.name || d.hostname || "Unknown"}</div>
                        <div className="text-xs text-slate-500 font-mono">{d.mac}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{d.model || d.type || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.ip || d.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeviceStatusBg(d.state || d.status)}`}>
                          {d.state || d.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatUptime(d.uptime)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); handleRestart(d); }}
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
          )}
        </div>

        {/* Device detail */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          {selected ? (
            <div>
              <h3 className="font-semibold text-white mb-4">{selected.name || "Device Details"}</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(selected).map(([k, v]) => {
                  if (typeof v === "object") return null;
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
              Click a device to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}