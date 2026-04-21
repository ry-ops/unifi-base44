import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteAlarms, getSiteEvents, getSiteDevices, getSiteClients, getIspMetrics } from "@/lib/unifi";
import ChatPanel from "@/components/chat/ChatPanel";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  const { selectedSite } = useNetwork();
  const [contextData, setContextData] = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (selectedSite?.id) loadContext();
  }, [selectedSite]);

  const loadContext = async () => {
    setLoadingContext(true);
    const hostId = selectedSite.hostId;
    const networkSiteId = selectedSite.networkSiteId || selectedSite.id;
    const siteId = networkSiteId;

    // Fetch enriched context in parallel; gracefully skip failures
    const safeCall = (fn) => fn.catch(() => null);

    const [alarms, events, devices, clients, ispMetrics] = await Promise.all([
      hostId && siteId ? safeCall(() => getSiteAlarms(hostId, siteId)) : null,
      hostId && siteId ? safeCall(() => getSiteEvents(hostId, siteId)) : null,
      hostId && siteId ? safeCall(() => getSiteDevices(hostId, siteId)) : null,
      hostId && siteId ? safeCall(() => getSiteClients(hostId, siteId)) : null,
      safeCall(() => getIspMetrics("5m", { duration: "24h" })),
    ]);

    const extract = (r) =>
      Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];

    setContextData({
      site: selectedSite,
      statistics: selectedSite.statistics,
      alarms: extract(alarms),
      events: extract(events).slice(0, 50),
      devices: extract(devices),
      clients: extract(clients),
      ispMetrics: extract(ispMetrics),
      loadedAt: new Date().toISOString(),
    });
    setLoadingContext(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" /> AI Assistant
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loadingContext
              ? "Loading network context..."
              : contextData
              ? `Context loaded: ${contextData.devices?.length || contextData.statistics?.counts?.totalDevice || 0} devices · ${contextData.clients?.length || (contextData.statistics?.counts?.wifiClient || 0) + (contextData.statistics?.counts?.wiredClient || 0)} clients · ${contextData.alarms?.length || 0} alarms`
              : "No site selected"}
          </p>
        </div>
        <button
          onClick={loadContext}
          disabled={loadingContext || !selectedSite}
          className="text-xs text-slate-400 hover:text-white transition-colors disabled:opacity-40"
        >
          Refresh context
        </button>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <ChatPanel contextData={contextData} />
      </div>
    </div>
  );
}