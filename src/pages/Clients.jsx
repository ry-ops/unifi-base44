import React from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { Users, Wifi, Activity, UserCheck, UserX } from "lucide-react";

export default function Clients() {
  const { selectedSite } = useNetwork();

  if (!selectedSite) {
    return <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>;
  }

  const counts = selectedSite.statistics?.counts || {};
  const totalClients = (counts.wifiClient || 0) + (counts.wiredClient || 0);
  const wifiPct = totalClients ? Math.round(((counts.wifiClient || 0) / totalClients) * 100) : 0;
  const wiredPct = totalClients ? Math.round(((counts.wiredClient || 0) / totalClients) * 100) : 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" /> Clients
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{totalClients} connected clients on {selectedSite.name}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Clients</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalClients}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">WiFi Clients</span>
          </div>
          <div className="text-4xl font-bold text-white">{counts.wifiClient || 0}</div>
          <div className="text-xs text-slate-500 mt-1">{wifiPct}% of total</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Wired Clients</span>
          </div>
          <div className="text-4xl font-bold text-white">{counts.wiredClient || 0}</div>
          <div className="text-xs text-slate-500 mt-1">{wiredPct}% of total</div>
        </div>
      </div>

      {/* Breakdown chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-5">Client Breakdown</h2>
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><Wifi className="w-3 h-3 text-blue-400" /> WiFi</span>
              <span className="text-white font-medium">{counts.wifiClient || 0} clients ({wifiPct}%)</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${wifiPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-green-400" /> Wired</span>
              <span className="text-white font-medium">{counts.wiredClient || 0} clients ({wiredPct}%)</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${wiredPct}%` }} />
            </div>
          </div>
          {counts.guestClient > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5"><UserCheck className="w-3 h-3 text-yellow-400" /> Guest</span>
                <span className="text-white font-medium">{counts.guestClient} clients</span>
              </div>
              <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${Math.round((counts.guestClient / totalClients) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-500 flex items-start gap-2">
        <UserX className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-600" />
        <span>
          The UniFi Site Manager API provides aggregated client counts only. Per-client details (MAC, IP, hostname, bandwidth) are available through the local UniFi controller API.
        </span>
      </div>
    </div>
  );
}