import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteClients, unifiCall } from "@/lib/unifi";
import ClientsTable from "@/components/dashboard/ClientsTable";
import { RefreshCw, Users } from "lucide-react";

export default function Clients() {
  const { selectedSite } = useNetwork();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const result = await getSiteClients(selectedSite.id);
    const arr = Array.isArray(result?.data?.data) ? result.data.data :
                Array.isArray(result?.data) ? result.data : [];
    setClients(arr);
    setLoading(false);
  };

  const handleAction = async (action, client) => {
    if (action === "block") {
      if (!confirm(`Block client ${client.name || client.mac}? They will lose network access.`)) return;
      await unifiCall("POST", `/v1/sites/${selectedSite.id}/clients/${client.id}/block`);
      alert("Block command sent.");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-cyan-400" /> Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} connected clients</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        {loading ? (
          <div className="text-center text-slate-500 py-16">Loading clients...</div>
        ) : (
          <ClientsTable clients={clients} onAction={handleAction} />
        )}
      </div>
    </div>
  );
}