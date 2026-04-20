import React, { useState } from "react";
import { formatBytes } from "@/lib/unifi";
import { Search, Wifi, Network } from "lucide-react";

export default function ClientsTable({ clients = [], onAction }) {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.name || c.hostname || "").toLowerCase().includes(q) ||
      (c.ip || c.ipAddress || "").includes(q) ||
      (c.mac || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700/50">
              <th className="pb-3 pr-4 text-slate-400 font-medium">Client</th>
              <th className="pb-3 pr-4 text-slate-400 font-medium">IP</th>
              <th className="pb-3 pr-4 text-slate-400 font-medium">Type</th>
              <th className="pb-3 pr-4 text-slate-400 font-medium">↑ Up</th>
              <th className="pb-3 pr-4 text-slate-400 font-medium">↓ Down</th>
              <th className="pb-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((client, i) => (
              <tr key={client.id || i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    {client.isWireless || client.type === "WIRELESS" ? (
                      <Wifi className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Network className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-white font-medium">{client.name || client.hostname || "Unknown"}</div>
                      <div className="text-slate-500 text-xs">{client.mac}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-300 font-mono text-xs">{client.ip || client.ipAddress || "—"}</td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-slate-400">{client.type || (client.isWireless ? "WiFi" : "Wired")}</span>
                </td>
                <td className="py-3 pr-4 text-slate-400 text-xs">{formatBytes(client.uplink?.txRate || client.txBytes)}</td>
                <td className="py-3 pr-4 text-slate-400 text-xs">{formatBytes(client.uplink?.rxRate || client.rxBytes)}</td>
                <td className="py-3">
                  <button
                    onClick={() => onAction && onAction("block", client)}
                    className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors"
                  >
                    Block
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-8">No clients found</div>
        )}
      </div>
    </div>
  );
}