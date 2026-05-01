import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Server, Users, Wifi, ShieldAlert, Terminal, MessageSquare, ChevronDown, ChevronRight, X, Settings, Radio, Router, BarChart2 } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/devices", label: "Devices", icon: Server },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/networks", label: "Networks", icon: Wifi },
  { path: "/gateway", label: "Gateway", icon: Router },
  { path: "/wifi", label: "WiFi", icon: Radio },
  { path: "/insights", label: "Insights", icon: BarChart2 },
  { path: "/security", label: "Security", icon: ShieldAlert },
  { path: "/terminal", label: "API Terminal", icon: Terminal },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ sites = [], selectedSite, onSiteChange, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const [sitesOpen, setSitesOpen] = useState(true);

  const handleNavClick = () => { if (onMobileClose) onMobileClose(); };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onMobileClose} />
      )}

      <div className={`
        fixed md:relative z-50 md:z-auto
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full flex-shrink-0
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
      {/* Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">UniFi Console</div>
            <div className="text-xs text-slate-500">Site Manager</div>
          </div>
        </div>
        <button onClick={onMobileClose} className="md:hidden text-slate-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sites selector */}
      {sites.length > 0 && (
        <div className="border-b border-slate-800 p-2">
          <button
            onClick={() => setSitesOpen(!sitesOpen)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-400 transition-colors"
          >
            {sitesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="uppercase tracking-wider font-semibold">Sites</span>
          </button>
          {sitesOpen && (
            <div className="mt-1 flex flex-col gap-0.5">
              {sites.map(site => (
                <button
                  key={site.id}
                  onClick={() => { onSiteChange(site); handleNavClick(); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors truncate ${
                    selectedSite?.id === site.id
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                  }`}
                >
                  {site.name || site.hostName || site.id}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Chat quick link */}
      <div className="p-2 border-t border-slate-800">
        <Link
          to="/chat"
          onClick={handleNavClick}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            location.pathname === "/chat"
              ? "bg-blue-600 text-white"
              : "bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI Assistant
        </Link>
      </div>
    </div>
    </>
  );
}