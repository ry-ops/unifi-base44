import React, { useState, useEffect } from "react";
import { getSiteEvents } from "@/lib/unifi";
import { useNetwork } from "@/components/layout/AppLayout";
import { Activity, RefreshCw, Wifi, WifiOff, AlertTriangle, Shield, Server, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function eventIcon(event) {
  const key = (event.key || event.type || "").toLowerCase();
  if (key.includes("disconnect") || key.includes("offline")) return <WifiOff className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  if (key.includes("connect") || key.includes("online")) return <Wifi className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
  if (key.includes("alarm") || key.includes("alert") || key.includes("threat")) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
  if (key.includes("firewall") || key.includes("block")) return <Shield className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />;
  if (key.includes("device") || key.includes("ap") || key.includes("switch")) return <Server className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  return <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
}

function eventMessage(event) {
  return event.message || event.msg || event.key || event.type || "Network event";
}

function eventTime(event) {
  const raw = event.datetime || event.timestamp;
  if (!raw) return null;
  try {
    const date = new Date(raw < 1e12 ? raw * 1000 : raw);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return null;
  }
}

export default function RecentEventsFeed() {
  const { selectedSite } = useNetwork();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.hostId && selectedSite?.networkSiteId) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getSiteEvents(selectedSite.hostId, selectedSite.networkSiteId || selectedSite.id);
      const raw = Array.isArray(result?.data?.data) ? result.data.data : [];
      setEvents(raw.slice(0, 20));
    } catch {
      setEvents([]);
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" /> Recent Events
        </h2>
        <button onClick={load} disabled={loading} className="text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading events...
        </div>
      ) : !events.length ? (
        <div className="text-center py-10 text-slate-500 text-sm">No recent events</div>
      ) : (
        <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
          {events.map((e, i) => (
            <div key={e.id || e._id || i} className="px-4 py-2.5 flex items-start gap-3">
              <div className="mt-0.5">{eventIcon(e)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-200 leading-snug truncate">{eventMessage(e)}</div>
                {eventTime(e) && (
                  <div className="text-xs text-slate-600 mt-0.5">{eventTime(e)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}