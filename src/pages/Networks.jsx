import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteNetworks, getSiteWlans } from "@/lib/unifi";
import NetworksPanel from "@/components/dashboard/NetworksPanel";
import { RefreshCw, Wifi } from "lucide-react";

export default function Networks() {
  const { selectedSite } = useNetwork();
  const [networks, setNetworks] = useState([]);
  const [wlans, setWlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const [netResult, wlanResult] = await Promise.all([
      getSiteNetworks(selectedSite.id),
      getSiteWlans(selectedSite.id),
    ]);
    const extract = (r) => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    setNetworks(extract(netResult));
    setWlans(extract(wlanResult));
    setLoading(false);
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Wifi className="w-5 h-5 text-blue-400" /> Networks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{wlans.length} WiFi networks, {networks.length} VLANs</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-16">Loading...</div>
        ) : (
          <NetworksPanel wlans={wlans} networks={networks} />
        )}
      </div>
    </div>
  );
}