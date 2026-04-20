import React, { useState, useEffect, createContext, useContext } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getSites } from "@/lib/unifi";
import { RefreshCw } from "lucide-react";
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

  const loadSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSites();
      // unifiCall returns response.data = { status, ok, data: { data: [...] } }
      const siteList = Array.isArray(result?.data?.data) ? result.data.data : [];
      if (siteList.length > 0) {
        // Normalize: API returns siteId, map to id for consistency
        const normalized = siteList.map(s => ({ ...s, id: s.siteId || s.id, name: s.meta?.desc || s.meta?.name || s.siteId }));
        setSites(normalized);
        if (!selectedSite) setSelectedSite(normalized[0]);
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
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
            <div className="flex items-center gap-2">
              {selectedSite && (
                <>
                  <span className="text-xs text-slate-500">Site:</span>
                  <span className="text-sm font-medium text-white">{selectedSite.name || selectedSite.hostName}</span>
                </>
              )}
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-slate-600">Updated {lastRefresh.toLocaleTimeString()}</span>
              )}
              <button
                onClick={loadSites}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
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