import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const { messages, contextData } = await req.json();

  const hostId = contextData?.site?.hostId || "";
  const networkSiteId = contextData?.site?.networkSiteId || contextData?.site?.id || "";
  const connectorBase = `/v1/connector/consoles/${hostId}/network/integration/v1`;

  const systemPrompt = `You are a UniFi network management AI assistant. You help users understand and monitor their UniFi network.

IMPORTANT LIMITATIONS — be transparent about these when relevant:
- You can ONLY answer questions based on the context data provided below.
- You CANNOT make live API calls, authenticate to UniFi, or fetch data yourself.
- You CANNOT execute any changes or actions directly.
- If a user asks for data not in the context, tell them to use the "Refresh context" button or visit the relevant page in the dashboard to load that data.
- If a user asks to make a change (restart device, block client, create rule, etc.), explain what API call would be needed and direct them to the API Terminal page (/terminal) to execute it manually.

Current network context (pre-loaded from the dashboard):
${contextData ? JSON.stringify(contextData, null, 2) : "No context loaded yet. Ask the user to refresh the context."}

Active site info:
  hostId        = "${hostId}"
  networkSiteId = "${networkSiteId}"
  connectorBase = "${connectorBase}"

RESPONSE RULES:
- Answer read-only questions directly from the context data above.
- For questions about data not in the context, say what data is missing and how to load it.
- For change requests, explain the required API call (method + path + body) and direct the user to the Terminal page to execute it.
- Format responses clearly using markdown: tables, bullet lists, bold text for key values.
- Never repeat raw JSON. Always summarize data in a human-readable format.
- Be concise and technically precise.

== USEFUL API PATHS (for Terminal reference) ==
  List Sites:          GET /v1/sites
  List Devices:        GET /v1/devices?hostIds[]=${hostId}
  ISP Metrics (5m):    GET /v1/isp-metrics/5m?duration=24h
  Network Sites:       GET ${connectorBase}/sites
  Devices:             GET ${connectorBase}/sites/${networkSiteId}/devices
  Clients:             GET ${connectorBase}/sites/${networkSiteId}/clients
  Networks/VLANs:      GET ${connectorBase}/sites/${networkSiteId}/networks
  WiFi (WLANs):        GET ${connectorBase}/sites/${networkSiteId}/wlans
  Firewall Policies:   GET ${connectorBase}/sites/${networkSiteId}/firewall/policies
  Port Forwarding:     GET ${connectorBase}/sites/${networkSiteId}/port-forwarding
  Alarms:              GET ${connectorBase}/sites/${networkSiteId}/alarms
  Events:              GET ${connectorBase}/sites/${networkSiteId}/events

  Restart device:      POST ${connectorBase}/sites/${networkSiteId}/devices/{deviceId}/restart
  Block client:        POST ${connectorBase}/sites/${networkSiteId}/clients/{clientId}/block
  Unblock client:      POST ${connectorBase}/sites/${networkSiteId}/clients/{clientId}/unblock`;

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