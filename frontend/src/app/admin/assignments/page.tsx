"use client";

import { useState } from "react";
import { API_BASE_URL, TENANT_ID } from "@/lib/api";
import { getToken } from "@/lib/auth";

export default function AssignmentsPage() {
  const [instrument, setInstrument] = useState("PREM_LITE");
  const [patientKey, setPatientKey] = useState("tok_demo_patient_1");
  const [encounterId, setEncounterId] = useState("ENC-1");
  const [out, setOut] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setOut(null);
    const token = getToken();
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    const res = await fetch(`${API_BASE_URL}/emr/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": TENANT_ID,
        "X-EMR-Api-Key": "dev_emr_api_key_change_me",
        "Idempotency-Key": `${encounterId}-${instrument}`
      },
      body: JSON.stringify({
        patientKey,
        encounterId,
        encounterDateTime: new Date().toISOString(),
        facilityId: "FAC-01",
        department: "DEPT-01",
        providerId: "PRV-01",
        diagnosisCodes: ["Z00.0"],
        procedureCodes: [],
        languagePreference: "en",
        contactChannels: [],
        surveyInstrumentCode: instrument,
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      })
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setOut(await res.json());
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Assignments (EMR trigger)</h1>
      <div className="rounded border bg-white p-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          Instrument
          <select className="rounded border p-2" value={instrument} onChange={(e) => setInstrument(e.target.value)}>
            <option value="PROM_LITE">PROM_LITE</option>
            <option value="PREM_LITE">PREM_LITE</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Patient Key
          <input className="rounded border p-2" value={patientKey} onChange={(e) => setPatientKey(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Encounter ID
          <input className="rounded border p-2" value={encounterId} onChange={(e) => setEncounterId(e.target.value)} />
        </label>
        <button className="rounded bg-black p-2 text-white" onClick={create}>
          Create assignment via EMR API
        </button>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
        {out ? (
          <div className="grid gap-2">
            <div className="text-sm">
              Survey URL:{" "}
              <a className="text-blue-700 underline" href={out.secureSurveyUrl} target="_blank" rel="noreferrer">
                Open patient survey
              </a>
            </div>
            <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(out, null, 2)}</pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}

