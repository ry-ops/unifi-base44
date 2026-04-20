import { base44 } from "@/api/base44Client";

export async function unifiCall(method, path, body = null) {
  const response = await base44.functions.invoke("unifiProxy", { method, path, body });
  return response.data;
}

export async function getSites() {
  return unifiCall("GET", "/v1/sites");
}

export async function getSiteDevices(siteId) {
  return unifiCall("GET", `/v1/sites/${siteId}/devices`);
}

export async function getSiteClients(siteId) {
  return unifiCall("GET", `/v1/sites/${siteId}/clients`);
}

export async function getHosts() {
  return unifiCall("GET", "/v1/hosts");
}

export async function getHost(hostId) {
  return unifiCall("GET", `/v1/hosts/${hostId}`);
}

export function getDeviceStatusColor(state) {
  if (!state) return "text-gray-400";
  const s = state.toLowerCase();
  if (s === "online" || s === "connected") return "text-green-400";
  if (s === "offline" || s === "disconnected") return "text-red-400";
  if (s === "pending" || s === "adopting") return "text-yellow-400";
  return "text-gray-400";
}

export function getDeviceStatusBg(state) {
  if (!state) return "bg-gray-500/20 text-gray-400";
  const s = state.toLowerCase();
  if (s === "online" || s === "connected") return "bg-green-500/20 text-green-400";
  if (s === "offline" || s === "disconnected") return "bg-red-500/20 text-red-400";
  if (s === "pending" || s === "adopting") return "bg-yellow-500/20 text-yellow-400";
  return "bg-gray-500/20 text-gray-400";
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatUptime(seconds) {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}