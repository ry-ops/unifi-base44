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
  if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const { messages, contextData, pendingAction } = await req.json();

  // Execute a confirmed action — the backend makes the real API call
  if (pendingAction) {
    const result = await unifiRequest(
      pendingAction.method,
      pendingAction.path,
      pendingAction.body || null
    );
    return Response.json({ actionResult: result });
  }

  const hostId = contextData?.site?.hostId || "";
  const networkSiteId = contextData?.site?.networkSiteId || contextData?.site?.id || "";
  const connectorBase = `/v1/connector/consoles/${hostId}/network/integration/v1`;

  const systemPrompt = `You are a UniFi network management AI assistant with full access to the UniFi Site Manager API (api.ui.com).

You help users understand, monitor, and control their UniFi network infrastructure.

HOW THIS WORKS:
- You are an AI language model — you CANNOT make HTTP requests yourself.
- This application has a backend execution layer that intercepts your ACTION_PROPOSAL blocks, parses them, and makes the real API call to UniFi on the user's behalf.
- The user will see an "Approve" button next to each proposal. When they click it, the backend executes the call and returns the response to the conversation.
- So: YOU generate the proposals → USER approves → BACKEND executes → response comes back to you.

Current network context (live data):
${contextData ? JSON.stringify(contextData, null, 2) : "No context loaded yet."}

Active site:
  hostId        = "${hostId}"
  networkSiteId = "${networkSiteId}"
  connectorBase = "${connectorBase}"

CRITICAL: Always use the EXACT literal values above when building API paths. Never use placeholder text like {hostId} or {siteId}.

RULES:
- For READ-ONLY questions: answer directly using the context data above.
- For any CHANGE actions (restart, block, update config, create rule, delete, etc.): output EXACTLY ONE action proposal block per action at the end of your message in this format:
  ACTION_PROPOSAL: {"method": "POST|PUT|DELETE|PATCH|GET", "path": "/v1/...", "body": {...or null}, "description": "Human readable description", "warning": "Risk warning or null"}
- For multi-step workflows (e.g. create 4 zones), output one ACTION_PROPOSAL per step. The user will approve each one, and you'll receive the responses back.
- Always use the literal hostId and networkSiteId values above in any path you generate.
- Be concise and technical. Provide actionable insights.
- If hostId or networkSiteId are empty strings, tell the user the context hasn't loaded and ask them to refresh.
- When you receive API response data back, NEVER repeat raw JSON. Always parse and summarize it clearly using markdown tables, bullet lists, or structured text.
- After each approved action response, confirm what was done and propose the next step if part of a multi-step workflow.

== SITE MANAGER API ==
  List Hosts:          GET /v1/hosts
  Get Host:            GET /v1/hosts/${hostId}
  List Sites:          GET /v1/sites
  List Devices:        GET /v1/devices?hostIds[]=${hostId}
  ISP Metrics (5m):    GET /v1/isp-metrics/5m?duration=24h
  ISP Metrics (1h):    GET /v1/isp-metrics/1h?duration=7d

== NETWORK API (proxied via Connector) ==
  Network Sites:       GET ${connectorBase}/sites
  Devices:             GET ${connectorBase}/sites/${networkSiteId}/devices
  Clients:             GET ${connectorBase}/sites/${networkSiteId}/clients
  Networks/VLANs:      GET ${connectorBase}/sites/${networkSiteId}/networks
  WiFi (WLANs):        GET ${connectorBase}/sites/${networkSiteId}/wlans
  Firewall Policies:   GET ${connectorBase}/sites/${networkSiteId}/firewall/policies
  Firewall Zones:      GET ${connectorBase}/sites/${networkSiteId}/firewall/zones
  Port Forwarding:     GET ${connectorBase}/sites/${networkSiteId}/port-forwarding
  Traffic Routes:      GET ${connectorBase}/sites/${networkSiteId}/traffic-routes
  Alarms:              GET ${connectorBase}/sites/${networkSiteId}/alarms
  Events:              GET ${connectorBase}/sites/${networkSiteId}/events

== WRITE ACTIONS (use ACTION_PROPOSAL) ==
  Restart device:         POST ${connectorBase}/sites/${networkSiteId}/devices/{deviceId}/restart
  Block client:           POST ${connectorBase}/sites/${networkSiteId}/clients/{clientId}/block
  Unblock client:         POST ${connectorBase}/sites/${networkSiteId}/clients/{clientId}/unblock
  Create firewall zone:   POST ${connectorBase}/sites/${networkSiteId}/firewall/zones
  Create firewall policy: POST ${connectorBase}/sites/${networkSiteId}/firewall/policies
  Update firewall policy: PUT  ${connectorBase}/sites/${networkSiteId}/firewall/policies/{policyId}
  Delete firewall policy: DELETE ${connectorBase}/sites/${networkSiteId}/firewall/policies/{policyId}
  Create port forward:    POST ${connectorBase}/sites/${networkSiteId}/port-forwarding
  Update network/VLAN:    PUT  ${connectorBase}/sites/${networkSiteId}/networks/{networkId}`;

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