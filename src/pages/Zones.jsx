import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { unifiCall } from "@/lib/unifi";
import { RefreshCw, ShieldCheck } from "lucide-react";
import ZoneList from "@/components/zones/ZoneList";
import ZoneMatrix from "@/components/zones/ZoneMatrix";
import PolicyDrawer from "@/components/zones/PolicyDrawer";
import ZoneTopology from "@/components/zones/ZoneTopology";
import ZoneNetworkSelector from "@/components/zones/ZoneNetworkSelector";

export default function Zones() {
  const { selectedSite } = useNetwork();
  const [zones, setZones] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null); // { src, dst } zone objects
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);

  useEffect(() => {
    if (selectedSite?.hostId) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const hostId = selectedSite.hostId;

    // Get network API site UUID
    const nsRes = await unifiCall("GET", `/v1/connector/consoles/${hostId}/network/integration/v1/sites`).catch(() => null);
    const nsList = Array.isArray(nsRes?.data?.data) ? nsRes.data.data : [];
    const ns = nsList.find(s => s.internalReference === (selectedSite?.meta?.name || "default")) || nsList[0];
    if (!ns) { setLoading(false); return; }

    const siteId = ns.id;
    const base = `/v1/connector/consoles/${hostId}/network/integration/v1/sites/${siteId}`;

    const [zonesRes, networksRes] = await Promise.all([
      unifiCall("GET", `${base}/firewall/zones`).catch(() => null),
      unifiCall("GET", `${base}/networks`).catch(() => null),
    ]);

    const zoneList = Array.isArray(zonesRes?.data?.data) ? zonesRes.data.data : [];
    const networkList = Array.isArray(networksRes?.data?.data) ? networksRes.data.data : [];

    // Paginate all policies
    let allPolicies = [];
    let offset = 0;
    const pageSize = 50;
    let total = null;
    do {
      const r = await unifiCall("GET", `${base}/firewall/policies?limit=${pageSize}&offset=${offset}`).catch(() => null);
      const page = r?.data;
      const items = Array.isArray(page?.data) ? page.data : [];
      allPolicies = allPolicies.concat(items);
      if (total === null) total = page?.totalCount ?? items.length;
      offset += pageSize;
    } while (allPolicies.length < total && total > 0);

    setZones(zoneList);
    setNetworks(networkList);
    setPolicies(allPolicies);
    setLoading(false);
  };

  if (!selectedSite) return (
    <div className="flex items-center justify-center h-full text-slate-500">No site selected</div>
  );

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-5 bg-slate-950 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" /> Firewall Zones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{selectedSite.name} · {zones.length} zones · {policies.length} policies</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg px-3 py-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !zones.length ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading zones...
        </div>
      ) : (
        <>
          <ZoneTopology
            zones={zones}
            policies={policies}
            networks={networks}
            selectedZone={selectedZone}
            selectedNetwork={selectedNetwork}
          />
          <ZoneNetworkSelector
            zones={zones}
            networks={networks}
            selectedZone={selectedZone}
            selectedNetwork={selectedNetwork}
            onSelectZone={(z) => { setSelectedZone(z); setSelectedNetwork(null); }}
            onSelectNetwork={(n) => { setSelectedNetwork(n); setSelectedZone(null); }}
          />
          <ZoneList zones={zones} networks={networks} />
          <ZoneMatrix zones={zones} policies={policies} onSelectPair={setSelectedPair} />
        </>
      )}

      {selectedPair && (
        <PolicyDrawer
          srcZone={selectedPair.src}
          dstZone={selectedPair.dst}
          policies={policies}
          allZones={zones}
          onClose={() => setSelectedPair(null)}
        />
      )}
    </div>
  );
}