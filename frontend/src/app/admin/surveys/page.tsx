"use client";

import { useEffect, useState } from "react";
import { apiFetch, TENANT_ID } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Instrument = {
  id: string;
  instrumentKey: string;
  displayName: string;
  createdAt: string;
};

export default function SurveysPage() {
  const [items, setItems] = useState<Instrument[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    try {
      const res = await apiFetch<Instrument[]>("/surveys/instruments", { token, tenantId: TENANT_ID });
      setItems(res);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold">Surveys</h1>
      {error ? <div className="mt-3 text-sm text-red-700">{error}</div> : null}
      <div className="mt-4 overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Instrument</th>
              <th className="p-2">Name</th>
              <th className="p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-2 font-mono">{i.instrumentKey}</td>
                <td className="p-2">{i.displayName}</td>
                <td className="p-2">{new Date(i.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-600" colSpan={3}>
                  No instruments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

