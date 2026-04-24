import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Key, CheckCircle, XCircle, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

function ApiKeyField({ label, secretName, description, onTestResult }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await base44.functions.invoke("saveSecret", { name: secretName, value: value.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
      </div>
      {description && <p className="text-xs text-slate-500 mb-4">{description}</p>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={`Enter ${label}…`}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-10"
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !value.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
    </div>
  );
}

function ConnectionStatus({ label, testFn, hint }) {
  const [status, setStatus] = useState("idle"); // idle | testing | ok | error
  const [message, setMessage] = useState(null);

  const test = async () => {
    setStatus("testing");
    setMessage(null);
    try {
      const res = await testFn();
      setStatus("ok");
      setMessage(res || "Connected");
    } catch (e) {
      setStatus("error");
      setMessage(e?.message || "Connection failed");
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {hint && <div className="text-xs text-slate-500">{hint}</div>}
        {message && (
          <div className={`text-xs mt-0.5 ${status === "ok" ? "text-green-400" : "text-red-400"}`}>{message}</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {status === "testing" && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
        {status === "ok" && <CheckCircle className="w-4 h-4 text-green-400" />}
        {status === "error" && <XCircle className="w-4 h-4 text-red-400" />}
        <button
          onClick={test}
          disabled={status === "testing"}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40"
        >
          Test
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const testUnifi = async () => {
    const res = await base44.functions.invoke("unifiProxy", { method: "GET", path: "/v1/sites" });
    const sites = res?.data?.data?.data;
    if (Array.isArray(sites)) return `OK — ${sites.length} site(s) found`;
    throw new Error("Unexpected response");
  };

  const testClaude = async () => {
    const res = await base44.functions.invoke("testClaudeKey", {});
    if (res?.data?.ok) return "Claude API key is valid";
    throw new Error(res?.data?.error || "Invalid key");
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-slate-400" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage API keys and integration credentials</p>
      </div>

      {/* API Key inputs */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">API Keys</h2>
        <ApiKeyField
          label="UniFi API Key"
          secretName="UNIFI_API_KEY"
          description="Your Ubiquiti Site Manager API key. Found at unifi.ui.com → API Keys."
        />
        <ApiKeyField
          label="Claude (Anthropic) API Key"
          secretName="CLAUDE_API_KEY"
          description="Optional. Used for AI-powered network assistant features. Get yours at console.anthropic.com."
        />
      </div>

      {/* Connection status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Connection Status</h2>
        <ConnectionStatus
          label="UniFi Site Manager"
          hint="Tests your UNIFI_API_KEY against /v1/sites"
          testFn={testUnifi}
        />
        <ConnectionStatus
          label="Claude (Anthropic)"
          hint="Tests your CLAUDE_API_KEY with a lightweight ping"
          testFn={testClaude}
        />
      </div>

      <p className="text-xs text-slate-600">
        API keys are stored as encrypted secrets and never exposed to the browser after saving.
      </p>
    </div>
  );
}