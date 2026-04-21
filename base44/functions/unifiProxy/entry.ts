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
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return { status: response.status, ok: response.ok, data };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let user = null;
  try { user = await base44.auth.me(); } catch (_) {}
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });

  const { method, path, body } = await req.json();

  if (!path || !path.startsWith("/")) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  const result = await unifiRequest(method || "GET", path, body || null);
  return Response.json(result);
});