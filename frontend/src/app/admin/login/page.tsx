"use client";

import { useState } from "react";
import { apiFetch, TENANT_ID } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const [tenantId, setTenantId] = useState(TENANT_ID);
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("admin1234");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setError(null);
    setOk(false);
    try {
      const res = await apiFetch<{ accessToken: string }>(`/auth/login`, {
        method: "POST",
        tenantId,
        body: JSON.stringify({ email, password })
      });
      setToken(res.accessToken);
      setOk(true);
      window.location.href = "/admin/dashboard";
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          Tenant ID (UUID)
          <input className="rounded border p-2" value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Email
          <input className="rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Password
          <input
            className="rounded border p-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="rounded bg-black p-2 text-white" onClick={submit}>
          Login
        </button>
        {ok ? <div className="text-sm text-green-700">Logged in.</div> : null}
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
      </div>
    </main>
  );
}

