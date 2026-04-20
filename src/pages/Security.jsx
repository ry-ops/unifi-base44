import React, { useState, useEffect } from "react";
import { useNetwork } from "@/components/layout/AppLayout";
import { getSiteAlarms, getSiteFirewallRules, getSiteEvents } from "@/lib/unifi";
import AlarmsPanel from "@/components/dashboard/AlarmsPanel";
import { RefreshCw, ShieldAlert, Flame, Bell } from "lucide-react";

export default function Security() {
  const { selectedSite } = useNetwork();
  const [alarms, setAlarms] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("alarms");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSite?.id) load();
  }, [selectedSite]);

  const load = async () => {
    setLoading(true);
    const [alarmResult, fwResult, evResult] = await Promise.all([
      getSiteAlarms(selectedSite.id),
      getSiteFirewallRules(selectedSite.id),
      getSiteEvents(selectedSite.id),
    ]);
    const extract = (r) => Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : [];
    setAlarms(extract(alarmResult));
    setFirewallRules(extract(fwResult));
    setEvents(extract(evResult));
    setLoading(false);
  };

  const tabs = [
    { id: "alarms", label: "Alarms", icon: Bell, count: alarms.length },
    { id: "firewall", label: "Firewall Rules", icon: Flame, count: firewallRules.length },
    { id: "events", label: "Events", icon: ShieldAlert, count: events.length },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-400" /> Security</h1>
          <p className="text-sm text-slate-500 mt-0.5">Alarms, firewall, and events</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count > 0 && (
                <span className="bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center text-slate-500 py-12">Loading...</div>
          ) : tab === "alarms" ? (
            <AlarmsPanel alarms={alarms} />
          ) : tab === "firewall" ? (
            <div className="overflow-x-auto">
              {!firewallRules.length ? (
                <div className="text-center text-slate-500 py-12">No firewall rules</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-left">
                      <th className="pb-3 pr-4 text-slate-400 font-medium">Name</th>
                      <th className="pb-3 pr-4 text-slate-400 font-medium">Action</th>
                      <th className="pb-3 pr-4 text-slate-400 font-medium">Protocol</th>
                      <th className="pb-3 pr-4 text-slate-400 font-medium">Source</th>
                      <th className="pb-3 text-slate-400 font-medium">Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firewallRules.map((r, i) => (
                      <tr key={r.id || i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4 text-white font-medium">{r.name || "Rule " + (i + 1)}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.action === "accept" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                            {r.action || "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-400">{r.protocol || "all"}</td>
                        <td className="py-3 pr-4 text-slate-400 font-mono text-xs">{r.srcAddress || r.source || "any"}</td>
                        <td className="py-3 text-slate-400 font-mono text-xs">{r.dstAddress || r.destination || "any"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
              {!events.length ? (
                <div className="text-center text-slate-500 py-12">No events</div>
              ) : events.map((ev, i) => (
                <div key={ev.id || i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                  <div className="flex-1">
                    <div className="text-sm text-white">{ev.message || ev.type || ev.key || "Event"}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                      {ev.datetime && <span>{new Date(ev.datetime).toLocaleString()}</span>}
                      {ev.subsystem && <span className="uppercase">{ev.subsystem}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}