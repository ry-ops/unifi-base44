import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteDevices, getSiteClients, getSiteAlarms, getSiteStatistics } from "@/lib/unifi";
import StatCard from "@/components/dashboard/StatCard";
import AlarmsPanel from "@/components/dashboard/AlarmsPanel";
import DevicesTable from "@/components/dashboard/DevicesTable";
import { Server, Users, Wifi, AlertTriangle, Activity, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { unifiCall } from "@/lib/unifi";

export default function Dashboard() {
  const { selectedSite } = useNetwork();
  const [devices, setDevices] = useState([]);
  const [clients, setClients] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSite?.id) return;
    loadData();
  }, [selectedSite]);

  const loadData = async () => {
    setLoading(true);
    const [devResult, clientResult, alarmResult] = await Promise.all([
      getSiteDevices(selectedSite.id),
      getSiteClients(selectedSite.id),
      getSiteAlarms(selectedSite.id),
    ]);

    const extractData = (r) => {
      if (!r) return [];
      if (Array.isArray(r?.data?.data)) return r.data.data;
      if (Array.isArray(r?.data)) return r.data;
      return [];
    };

    setDevices(extractData(devResult));
    setClients(extractData(clientResult));
    setAlarms(extractData(alarmResult));
    setLoading(false);
  };

  const onlineDevices = devices.filter(d => {
    const s = (d.state || d.status || "").toLowerCase();
    return s === "online" || s === "connected";
  });
  const offlineDevices = devices.filter(d => {
    const s = (d.state || d.status || "").toLowerCase();
    return s === "offline" || s === "disconnected";
  });
  const wirelessClients = clients.filter(c => c.isWireless || c.type === "WIRELESS");
  const wiredClients = clients.filter(c => !c.isWireless && c.type !== "WIRELESS");

  const handleDeviceAction = async (action, device) => {
    if (!confirm(`${action === "restart" ? "Restart" : "Block"} ${device.name || device.mac}?`)) return;
    if (action === "restart") {
      await unifiCall("POST", `/v1/sites/${selectedSite.id}/devices/${device.id}/restart`);
    }
  };

  if (!selectedSite) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">No site selected</div>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{selectedSite.name || selectedSite.hostName} — Network Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard title="Total Devices" value={devices.length} icon={Server} color="blue" />
        <StatCard title="Online" value={onlineDevices.length} icon={CheckCircle} color="green" />
        <StatCard title="Offline" value={offlineDevices.length} icon={XCircle} color="red" />
        <StatCard title="Total Clients" value={clients.length} icon={Users} color="cyan" />
        <StatCard title="WiFi Clients" value={wirelessClients.length} icon={Wifi} color="purple" />
        <StatCard title="Active Alarms" value={alarms.length} icon={AlertTriangle} color={alarms.length > 0 ? "red" : "green"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Devices overview */}
        <div className="xl:col-span-2 bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Devices</h2>
            <Link to="/devices" className="text-xs text-blue-400 hover:text-blue-300">View all →</Link>
          </div>
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading...</div>
          ) : (
            <DevicesTable devices={devices.slice(0, 8)} onAction={handleDeviceAction} />
          )}
        </div>

        {/* Alarms */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Active Alarms
            </h2>
            <Link to="/security" className="text-xs text-blue-400 hover:text-blue-300">All events →</Link>
          </div>
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading...</div>
          ) : (
            <AlarmsPanel alarms={alarms} />
          )}
        </div>
      </div>

      {/* Client breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-400" /> Wireless Clients
          </h2>
          <div className="text-3xl font-bold text-white">{wirelessClients.length}</div>
          <div className="text-xs text-slate-500 mt-1">of {clients.length} total clients</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: clients.length ? `${(wirelessClients.length / clients.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" /> Wired Clients
          </h2>
          <div className="text-3xl font-bold text-white">{wiredClients.length}</div>
          <div className="text-xs text-slate-500 mt-1">of {clients.length} total clients</div>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: clients.length ? `${(wiredClients.length / clients.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}