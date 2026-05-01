import React, { useState, useEffect, useRef } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { unifiCall, formatBytes, getIspMetrics } from "@/lib/unifi";
import { RefreshCw, BarChart2, Wifi, Signal, Radio, Activity, Cpu, Database, Globe } from "lucide-react";
import ClientsBandChart from "@/components/insights/ClientsBandChart";
import ClientsSignalChart from "@/components/insights/ClientsSignalChart";
import APHealthTable from "@/components/insights/APHealthTable";
import TrafficChart from "@/components/insights/TrafficChart";
import ChannelUtilChart from "@/components/insights/ChannelUtilChart";
import WanMetricsChart from "@/components/insights/WanMetricsChart";
import TopClientsTable from "@/components/insights/TopClientsTable";

const REFRESH_INTERVALS = [
  { label: "Off", value: 0 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
];

export default function Insights() {
  const { selectedSite } = useNetwork();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(60);
  const timerRef = useRef(null);

  useEffect(() => {
    if (selectedSite?.hostId) load();
  }, [selectedSite]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoRefresh > 0) {
      timerRef.current = setInterval(() => {
        if (selectedSite?.hostId) load();
      }, autoRefresh * 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, selectedSite]);

  const load = async () => {
    setLoading(true);
    const hostId = selectedSite.hostId;
    const siteRef = selectedSite?.meta?.name || "default";
    const base = `/v1/connector/consoles/${hostId}/proxy/network/api/s/${siteRef}`;

    const [staRes, apRes, healthRes, ispRes] = await Promise.all([
      unifiCall("GET", `${base}/stat/sta`).catch(() => null),
      unifiCall("GET", `${base}/stat/device`).catch(() => null),
      unifiCall("GET", `${base}/stat/health`).catch(() => null),
      getIspMetrics("5m", { duration: "6h" }).catch(() => null),
    ]);

    const clients = Array.isArray(staRes?.data?.data) ? staRes.data.data : [];
    const devices = Array.isArray(apRes?.data?.data) ? apRes.data.data : [];
    const healthList = Array.isArray(healthRes?.data?.data) ? healthRes.data.data : [];

    // Parse ISP metrics into time series
    const ispRaw = Array.isArray(ispRes?.data?.data) ? ispRes.data.data : [];
    const ispSeries = [];
    ispRaw.forEach(entry => {
      (entry.periods || []).forEach(p => {
        const ts = p.metricTime || p.timestamp;
        const wan = p.data?.wan || {};
        if (!ts) return;
        ispSeries.push({
          time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          download: (wan.download_kbps || 0) / 1000,
          upload: (wan.upload_kbps || 0) / 1000,
          latency: wan.avgLatency || null,
        });
      });
    });
    ispSeries.sort((a, b) => a.time.localeCompare(b.time));

    setData({ clients, devices, healthList, ispSeries });
    setLastRefresh(new Date());
    setLoading(false);
  };

  if (!selectedSite) return (
    <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>
  );

  const wifiClients = data?.clients.filter(c => !c.is_wired) || [];
  const wan = data?.healthList.find(h => h.subsystem === "wan") || {};
  const wlan = data?.healthList.find(h => h.subsystem === "wlan") || {};
  const cpu = parseFloat(wan["gw_system-stats"]?.cpu || 0);
  const mem = parseFloat(wan["gw_system-stats"]?.mem || 0);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5 bg-slate-950 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-400" /> Network Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedSite.name} · {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            Auto-refresh:
            <div className="flex rounded-md overflow-hidden border border-slate-700 ml-1">
              {REFRESH_INTERVALS.map(r => (
                <button key={r.value} onClick={() => setAutoRefresh(r.value)}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${autoRefresh === r.value ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg px-3 py-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
        {[
          { label: "WiFi Clients", value: wifiClients.length, color: "text-blue-400" },
          { label: "2.4 GHz", value: wifiClients.filter(c => c.radio === "ng").length, color: "text-yellow-400" },
          { label: "5 GHz", value: wifiClients.filter(c => c.radio === "na").length, color: "text-cyan-400" },
          { label: "6 GHz", value: wifiClients.filter(c => c.radio === "6g").length, color: "text-purple-400" },
          { label: "APs Online", value: data?.devices.filter(d => d.state === 1).length ?? 0, color: "text-green-400" },
          { label: "APs Total", value: data?.devices.length ?? 0, color: "text-slate-300" },
          { label: "GW CPU", value: cpu ? `${cpu.toFixed(1)}%` : "—", color: cpu > 80 ? "text-red-400" : cpu > 60 ? "text-yellow-400" : "text-green-400" },
          { label: "GW Mem", value: mem ? `${mem.toFixed(1)}%` : "—", color: mem > 85 ? "text-red-400" : mem > 70 ? "text-yellow-400" : "text-green-400" },
        ].map(k => (
          <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
            <div className="text-xs text-slate-500 mb-0.5">{k.label}</div>
            <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Clients by Band + Signal Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClientsBandChart clients={wifiClients} />
        <ClientsSignalChart clients={wifiClients} />
      </div>

      {/* Row 2: WAN Throughput + Latency */}
      <WanMetricsChart series={data?.ispSeries || []} />

      {/* Row 3: AP Health Table */}
      <APHealthTable devices={data?.devices || []} />

      {/* Row 4: Channel Utilization */}
      <ChannelUtilChart devices={data?.devices || []} />

      {/* Row 5: Traffic per AP + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrafficChart devices={data?.devices || []} />
        <TopClientsTable clients={wifiClients} />
      </div>
    </div>
  );
}