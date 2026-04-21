import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getSites, getNetworkSites } from "@/lib/unifi";
import { RefreshCw, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const NetworkContext = createContext(null);
export const useNetwork = () => useContext(NetworkContext);

export default function AppLayout() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const loadSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSites();
      // unifiCall returns response.data = { status, ok, data: { data: [...] } }
      const siteList = Array.isArray(result?.data?.data) ? result.data.data : [];
      if (siteList.length > 0) {
        // Normalize: API returns siteId, map to id for consistency
        const normalized = siteList.map(s => ({ ...s, id: s.siteId || s.id, hostId: s.hostId, name: s.meta?.desc || s.meta?.name || s.siteId }));

        // Resolve Network API UUID siteId per host (needed for Network API sub-resource calls)
        const hostIds = [...new Set(normalized.map(s => s.hostId).filter(Boolean))];
        const networkSiteMaps = await Promise.all(
          hostIds.map(async hostId => {
            const r = await getNetworkSites(hostId).catch(() => null);
            const list = Array.isArray(r?.data?.data) ? r.data.data : [];
            return { hostId, list };
          })
        );
        // Build lookup: hostId + internalReference -> network siteId (UUID)
        const lookup = {};
        networkSiteMaps.forEach(({ hostId, list }) => {
          list.forEach(ns => { lookup[`${hostId}::${ns.internalReference}`] = ns.id; });
        });
        // Attach networkSiteId to each site
        const enriched = normalized.map(s => ({
          ...s,
          networkSiteId: lookup[`${s.hostId}::${s.meta?.name}`] || null,
        }));

        setSites(enriched);
        if (!selectedSite) setSelectedSite(enriched[0]);
      } else {
        setError("No sites found. Check your API key permissions.");
      }
    } catch (err) {
      setError("Failed to connect: " + (err?.message || "Unknown error"));
    }
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    loadSites();
  }, []);

  return (
    <NetworkContext.Provider value={{ sites, selectedSite, setSelectedSite, refresh: loadSites, lastRefresh }}>
      <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
        <Sidebar
          sites={sites}
          selectedSite={selectedSite}
          onSiteChange={setSelectedSite}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="flex md:hidden text-slate-400 hover:text-white p-2 -ml-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              {selectedSite && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 hidden sm:inline">Site:</span>
                  <span className="text-sm font-medium text-white truncate max-w-[160px] sm:max-w-none">{selectedSite.name || selectedSite.hostName}</span>
                </div>
              )}
              {error && <span className="text-xs text-red-400 truncate">{error}</span>}
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-slate-600 hidden sm:inline">Updated {lastRefresh.toLocaleTimeString()}</span>
              )}
              <button
                onClick={loadSites}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-auto">
            {loading && !sites.length ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-slate-400 text-sm">Connecting to UniFi API...</span>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </NetworkContext.Provider>
  );
}