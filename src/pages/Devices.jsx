import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteDevices, getNetworkSites, getDeviceStatusBg, formatUptime } from "@/lib/unifi";
import { RefreshCw, Server, Wifi, Router, HardDrive, ChevronRight } from "lucide-react";

function deviceIcon(d) {
  const t = (d.model || d.type || "").toLowerCase();
  if (t.includes("ap") || t.includes("uap") || t.includes("wifi")) return <Wifi className="w-4 h-4 text-blue-400" />;
  if (t.includes("gateway") || t.includes("ugw") || t.includes("udm") || t.includes("uxg") || t.includes("ucg")) return <Router className="w-4 h-4 text-green-400" />;
  return <HardDrive className="w-4 h-4 text-slate-400" />;
}

function DetailRow({ label, value }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5 py-1.5 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-slate-200 font-mono break-all">{String(value)}</span>
    </div>
  );
}

export default function Devices() {
  const { selectedSite } = useNetwork();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedSite?.hostId && selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);

    let networkSiteId = selectedSite.networkSiteId;
    if (!networkSiteId && selectedSite.hostId) {
      const nsResult = await getNetworkSites(selectedSite.hostId).catch(() => null);
      const nsList = Array.isArray(nsResult?.data?.data) ? nsResult.data.data : [];
      const match = nsList.find(ns => ns.internalReference === selectedSite.meta?.name || nsList.length === 1);
      networkSiteId = match?.id || null;
    }

    const result = await getSiteDevices(selectedSite.hostId, networkSiteId || selectedSite.id).catch(e => { setError(e?.message || "Failed"); return null; });
    const list = Array.isArray(result?.data?.data) ? result.data.data
      : Array.isArray(result?.data) ? result.data : [];
    setDevices(list);
    setLoading(false);
  };

  const counts = selectedSite?.statistics?.counts || {};
  const totalDevices = devices.length || counts.totalDevice || 0;
  const onlineCount = devices.length ? devices.filter(d => (d.state || "").toLowerCase() === "online" || !d.state).length : (totalDevices - (counts.offlineDevice || 0));

  if (!selectedSite) return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" /> Devices
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalDevices} total · {counts.offlineDevice || 0} offline · {selectedSite.name}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Summary cards — Site Manager API counts */}
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
        {/* Device list — Network API */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network API — Live Devices</span>
            {devices.length > 0 && <span className="text-xs text-slate-500">{devices.length} devices</span>}
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-sm text-red-400">{error}</div>
          ) : !devices.length ? (
            <div className="text-center text-slate-500 py-16">
              <Server className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No devices returned from Network API</p>
              <p className="text-xs mt-1 text-slate-600">Requires Cloud Gateway with UniFi OS 4.1.9+</p>
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

                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d, i) => (
                    <tr
                      key={d.id || d.mac || i}
                      onClick={() => setSelected(selected?.id === d.id ? null : d)}
                      className={`border-b border-slate-800/50 cursor-pointer transition-colors ${selected?.id === d.id ? "bg-blue-600/10" : "hover:bg-slate-800/40"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {deviceIcon(d)}
                          <div>
                            <div className="text-white font-medium">{d.name || d.hostname || "Unknown"}</div>
                            {d.mac && <div className="text-xs text-slate-500 font-mono">{d.mac}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{d.model || d.shortname || "—"}</td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.ip || d.ipAddress || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeviceStatusBg(d.state || d.status || "online")}`}>
                          {d.state || d.status || "Online"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${selected?.id === d.id ? "rotate-90 text-blue-400" : ""}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Device detail panel */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 overflow-y-auto max-h-[600px]">
          {selected ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                {deviceIcon(selected)}
                <h3 className="font-semibold text-white">{selected.name || selected.hostname || "Device Details"}</h3>
              </div>
              <div className="flex flex-col">
                <DetailRow label="ID" value={selected.id} />
                <DetailRow label="MAC" value={selected.mac} />
                <DetailRow label="Model" value={selected.model || selected.shortname} />
                <DetailRow label="IP Address" value={selected.ip || selected.ipAddress} />
                <DetailRow label="State" value={selected.state || selected.status} />
                <DetailRow label="Uptime" value={formatUptime(selected.uptime || selected.uptimeSecs || selected.uptimeSeconds)} />
                <DetailRow label="Firmware" value={selected.version || selected.firmwareVersion} />
                <DetailRow label="Serial" value={selected.serial} />
                <DetailRow label="Type" value={selected.type} />
                <DetailRow label="Feature" value={selected.feature} />
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Site Summary</div>
              <div className="flex flex-col gap-2 text-xs">
                {[
                  { label: "Total Devices", value: counts.totalDevice || 0 },
                  { label: "Online", value: onlineCount, green: true },
                  { label: "Offline", value: counts.offlineDevice || 0, red: counts.offlineDevice > 0 },
                  { label: "Gateways", value: counts.gatewayDevice || 0 },
                  { label: "WiFi APs", value: counts.wifiDevice || 0 },
                  { label: "Wired", value: counts.wiredDevice || 0 },
                  { label: "Pending Updates", value: counts.pendingUpdateDevice || 0, yellow: counts.pendingUpdateDevice > 0 },
                  { label: "Offline Gateway", value: counts.offlineGatewayDevice || 0, red: counts.offlineGatewayDevice > 0 },
                  { label: "Offline APs", value: counts.offlineWifiDevice || 0, red: counts.offlineWifiDevice > 0 },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                    <span className="text-slate-400">{item.label}</span>
                    <span className={item.red ? "text-red-400" : item.green ? "text-green-400" : item.yellow ? "text-yellow-400" : "text-white"}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              {devices.length > 0 && (
                <p className="text-xs text-slate-600 mt-4">Click a device to see details</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}