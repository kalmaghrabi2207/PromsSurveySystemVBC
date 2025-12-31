"use client";

import { useState } from "react";
import { API_BASE_URL, TENANT_ID } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<"csv" | "excel" | "json">("csv");
  const [mode, setMode] = useState<"reject" | "new_version" | "overwrite_draft">("new_version");
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setStatus(null);
    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    if (!file) {
      setError("Select a file");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("sourceType", sourceType);
    form.append("mode", mode);

    const res = await fetch(`${API_BASE_URL}/imports/question-bank`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Id": TENANT_ID
      },
      body: form
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const j = await res.json();
    setJobId(j.importJobId);
  }

  async function poll() {
    if (!jobId) return;
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/imports/${jobId}`, {
      headers: { Authorization: `Bearer ${token}`, "X-Tenant-Id": TENANT_ID }
    });
    setStatus(await res.json());
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Import Question Bank</h1>
      <div className="mt-4 grid gap-3 rounded border bg-white p-4">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="grid gap-1">
            Source
            <select className="rounded border p-2" value={sourceType} onChange={(e) => setSourceType(e.target.value as any)}>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <label className="grid gap-1">
            Mode
            <select className="rounded border p-2" value={mode} onChange={(e) => setMode(e.target.value as any)}>
              <option value="new_version">new_version</option>
              <option value="reject">reject</option>
              <option value="overwrite_draft">overwrite_draft</option>
            </select>
          </label>
        </div>
        <button className="rounded bg-black p-2 text-white" onClick={start}>
          Start Import
        </button>
        {jobId ? (
          <div className="text-sm">
            Job: <span className="font-mono">{jobId}</span>{" "}
            <button className="ml-2 rounded border px-2 py-1" onClick={poll}>
              Poll
            </button>
          </div>
        ) : null}
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
        {status ? <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(status, null, 2)}</pre> : null}
      </div>
    </div>
  );
}

