import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const UNIFI_BASE = "https://api.ui.com";
const API_KEY = Deno.env.get("UNIFI_API_KEY");

async function unifiRequest(method, path, body = null) {
  const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${UNIFI_BASE}${path}`, options);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: response.status, ok: response.ok, data };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, contextData, pendingAction } = await req.json();

  // Execute a confirmed action
  if (pendingAction) {
    const result = await unifiRequest(
      pendingAction.method,
      pendingAction.path,
      pendingAction.body || null
    );
    return Response.json({ actionResult: result });
  }

  const hostId = contextData?.site?.hostId || "";
  const siteId = contextData?.site?.id || "";

  const systemPrompt = `You are a UniFi network management AI assistant with full access to the UniFi Site Manager API (api.ui.com).

You help users understand, monitor, and control their UniFi network infrastructure.

Current network context (live data):
${contextData ? JSON.stringify(contextData, null, 2) : "No context loaded yet."}

Active site: hostId=${hostId}, siteId=${siteId}

RULES:
- For READ-ONLY questions: answer directly using the context data above.
- For any CHANGE actions (restart, block, update config, create rule, delete, etc.): output EXACTLY ONE action proposal block at the end of your message in this format:
  ACTION_PROPOSAL: {"method": "POST|PUT|DELETE|PATCH|GET", "path": "/v1/...", "body": {...or null}, "description": "Human readable description", "warning": "Risk warning or null"}
- Be concise and technical. Provide actionable insights.

== SITE MANAGER API (api.ui.com) ==
  List Hosts:          GET /v1/hosts
  Get Host:            GET /v1/hosts/{hostId}
  List Sites:          GET /v1/sites
  List Devices:        GET /v1/devices?hostIds[]={hostId}
  ISP Metrics (5m):    GET /v1/isp-metrics/5m?duration=24h
  ISP Metrics (1h):    GET /v1/isp-metrics/1h?duration=7d
  Query ISP Metrics:   POST /v1/isp-metrics/{type}/query

== NETWORK API (proxied via Connector) ==
Base path: /v1/connector/consoles/${hostId}/network/integration/v1

  Network Sites:       GET .../sites
  Devices:             GET .../sites/${siteId}/devices
  Clients:             GET .../sites/${siteId}/clients
  Networks/VLANs:      GET .../sites/${siteId}/networks
  WiFi (WLANs):        GET .../sites/${siteId}/wlans
  Firewall Rules:      GET .../sites/${siteId}/firewall/rules
  Port Forwarding:     GET .../sites/${siteId}/port-forwarding
  Traffic Routes:      GET .../sites/${siteId}/traffic-routes
  Alarms:              GET .../sites/${siteId}/alarms
  Events:              GET .../sites/${siteId}/events

== WRITE ACTIONS (use ACTION_PROPOSAL) ==
  Restart device:      POST .../sites/${siteId}/devices/{deviceId}/restart
  Block client:        POST .../sites/${siteId}/clients/{clientId}/block
  Unblock client:      POST .../sites/${siteId}/clients/{clientId}/unblock
  Create firewall rule: POST .../sites/${siteId}/firewall/rules
  Create port forward: POST .../sites/${siteId}/port-forwarding`;

  // Build conversation as a single prompt
  const conversationText = messages
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}\n\n---\n\n${conversationText}`;

  const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: fullPrompt,
    model: "claude_sonnet_4_6",
  });

  return Response.json({ reply });
});