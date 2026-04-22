import { base44 } from "@/api/base44Client";

// ─── Core HTTP wrapper ────────────────────────────────────────────────────────
export async function unifiCall(method, path, body = null) {
  const response = await base44.functions.invoke("unifiProxy", { method, path, body });
  return response.data;
}

// ─── Site Manager API ─────────────────────────────────────────────────────────

/** List all hosts associated with the account */
export async function getHosts() {
  return unifiCall("GET", "/v1/hosts");
}

/** Get a specific host by ID */
export async function getHost(hostId) {
  return unifiCall("GET", `/v1/hosts/${hostId}`);
}

/** List all sites */
export async function getSites() {
  return unifiCall("GET", "/v1/sites");
}

/**
 * List all devices (global, across hosts).
 * @param {string[]} [hostIds] - optional array of host IDs to filter
 */
export async function getDevices(hostIds = []) {
  const qs = hostIds.map(id => `hostIds[]=${encodeURIComponent(id)}`).join("&");
  const path = qs ? `/v1/devices?${qs}` : "/v1/devices";
  return unifiCall("GET", path);
}

/**
 * Get ISP metrics.
 * @param {"5m"|"1h"} type - interval type
 * @param {object} [params] - optional query params: beginTimestamp, endTimestamp, duration
 */
export async function getIspMetrics(type = "5m", params = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const path = qs ? `/v1/isp-metrics/${type}?${qs}` : `/v1/isp-metrics/${type}`;
  return unifiCall("GET", path);
}

/**
 * Query ISP metrics for specific sites.
 * @param {"5m"|"1h"} type - interval type
 * @param {Array} sites - array of site query objects
 */
export async function queryIspMetrics(type = "1h", sites = []) {
  return unifiCall("POST", `/v1/isp-metrics/${type}/query`, { sites });
}

// ─── Network API (via Connector Proxy) ───────────────────────────────────────
// These proxy through: GET /v1/connector/consoles/{hostId}/network/integration/v1/...

function connectorPath(hostId, networkPath) {
  return `/v1/connector/consoles/${hostId}/network/integration/v1/${networkPath}`;
}

/** List Network API sites on a host */
export async function getNetworkSites(hostId) {
  return unifiCall("GET", connectorPath(hostId, "sites"));
}

/** List devices on a site via Network API */
export async function getSiteDevices(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/devices`));
}

/** List clients on a site via Network API */
export async function getSiteClients(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/clients`));
}

/** List networks (LANs/VLANs) on a site via Network API */
export async function getSiteNetworks(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/networks`));
}

/** List WiFi networks on a site via Network API */
export async function getSiteWlans(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/wlans`));
}

/** List ALL firewall policies on a site via Network API (paginates through all pages) */
export async function getSiteFirewallRules(hostId, siteId) {
  const pageSize = 25;
  let offset = 0;
  let allRules = [];
  let totalCount = null;

  do {
    const result = await unifiCall("GET", connectorPath(hostId, `sites/${siteId}/firewall/policies?limit=${pageSize}&offset=${offset}`));
    const page = result?.data;
    const items = Array.isArray(page?.data) ? page.data : [];
    allRules = allRules.concat(items);
    if (totalCount === null) totalCount = page?.totalCount ?? items.length;
    offset += pageSize;
  } while (allRules.length < totalCount);

  // Return in the same shape the rest of the app expects
  return { data: { data: allRules } };
}

/** List firewall zones on a site via Network API */
export async function getSiteFirewallZones(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/firewall/zones`));
}

/** List port forwarding rules on a site via Network API */
export async function getSitePortForwarding(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/port-forwarding`));
}

/** List traffic routes on a site via Network API */
export async function getSiteTrafficRoutes(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/traffic-routes`));
}

/** List alarms on a site via the legacy proxy (Network Integration API has no /alarms endpoint) */
export async function getSiteAlarms(hostId, siteId, siteInternalRef = "default") {
  return unifiCall("GET", `/v1/connector/consoles/${hostId}/proxy/network/api/s/${siteInternalRef}/rest/alarm`);
}

/** List events on a site via Network API */
export async function getSiteEvents(hostId, siteId) {
  return unifiCall("GET", connectorPath(hostId, `sites/${siteId}/events`));
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

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