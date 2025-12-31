"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiFetch, TENANT_ID } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }
    try {
      const res = await apiFetch<any>("/reporting/dashboard", { token, tenantId: TENANT_ID });
      setData(res);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) return <div className="text-sm text-red-700">{error}</div>;
  if (!data) return <div className="text-sm text-gray-600">Loading…</div>;

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Eligible</div>
          <div className="text-lg font-semibold">{data.kpis.eligibleAssignments}</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Delivered</div>
          <div className="text-lg font-semibold">{data.kpis.deliveredAssignments}</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Completed</div>
          <div className="text-lg font-semibold">{data.kpis.completedResponses}</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Response (created)</div>
          <div className="text-lg font-semibold">{(data.kpis.responseRateCreated * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded border bg-white p-3">
          <div className="text-xs text-gray-500">Response (delivered)</div>
          <div className="text-lg font-semibold">{(data.kpis.responseRateDelivered * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-3">
          <div className="text-sm font-medium">Responses by day</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.responsesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="started" stroke="#8884d8" />
                <Line type="monotone" dataKey="completed" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border bg-white p-3">
          <div className="text-sm font-medium">Outreach by channel</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.outreachByChannel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="#8884d8" />
                <Bar dataKey="delivered" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded border bg-white">
        <div className="border-b p-3 text-sm font-medium">Recent assignments</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Instrument</th>
                <th className="p-2">Status</th>
                <th className="p-2">Encounter</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.table.recentAssignments.map((a: any) => (
                <tr key={a.id} className="border-t">
                  <td className="p-2 font-mono">{a.id.slice(0, 8)}…</td>
                  <td className="p-2 font-mono">{a.instrumentKey}</td>
                  <td className="p-2">{a.status}</td>
                  <td className="p-2">{a.encounterId}</td>
                  <td className="p-2">{new Date(a.encounterDateTime).toLocaleString()}</td>
                </tr>
              ))}
              {data.table.recentAssignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-gray-600">
                    No assignments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

