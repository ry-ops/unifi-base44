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
  const user = await base44.auth.me();
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

  const systemPrompt = `You are a UniFi network management AI assistant with full access to the UniFi Site Manager API (api.ui.com).

You help users understand, monitor, and control their UniFi network infrastructure.

Current network context (live data):
${contextData ? JSON.stringify(contextData, null, 2) : "No context loaded yet."}

RULES:
- For READ-ONLY questions: answer directly using the context data above.
- For any CHANGE actions (restart, block, update config, create rule, delete, etc.): output EXACTLY ONE action proposal block at the end of your message in this format:
  ACTION_PROPOSAL: {"method": "POST|PUT|DELETE|PATCH|GET", "path": "/v1/...", "body": {...or null}, "description": "Human readable description", "warning": "Risk warning or null"}
- Be concise and technical. Provide actionable insights.
- Key API paths:
  Sites: GET /v1/sites
  Devices: GET /v1/sites/{siteId}/devices  
  Clients: GET /v1/sites/{siteId}/clients
  Alarms: GET /v1/sites/{siteId}/alarms
  Events: GET /v1/sites/{siteId}/events
  Firewall: GET/POST /v1/sites/{siteId}/firewall/rules
  Networks/VLANs: GET /v1/sites/{siteId}/networks
  WiFi: GET /v1/sites/{siteId}/wlans
  Restart device: POST /v1/sites/{siteId}/devices/{deviceId}/restart
  Block client: POST /v1/sites/{siteId}/clients/{clientId}/block
  Unblock client: POST /v1/sites/{siteId}/clients/{clientId}/unblock
  Port forwarding: GET/POST /v1/sites/{siteId}/port-forwarding
  Traffic routes: GET /v1/sites/{siteId}/traffic-routes
  Hosts: GET /v1/hosts
  ISP metrics: GET /v1/isp-metrics`;

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