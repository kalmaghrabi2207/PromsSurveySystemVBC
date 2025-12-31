"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/lib/api";

type Q = {
  id: string;
  code: string;
  type: string;
  text: string;
  required: boolean;
  choices: Array<{ id: string; label: string; value: string }>;
};

export default function PatientSurveyPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<any>(null);

  const questions: Q[] = useMemo(() => {
    if (!data?.survey?.sections) return [];
    const qs: Q[] = [];
    for (const s of data.survey.sections) {
      for (const g of s.groups) {
        for (const q of g.questions) qs.push(q);
        for (const sg of g.subGroups ?? []) for (const q of sg.questions) qs.push(q);
      }
    }
    return qs;
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/public/surveys/${token}/start`, { cache: "no-store" });
        if (!res.ok) {
          setError(await res.text());
          return;
        }
        const j = await res.json();
        setData(j);
        const a: Record<string, any> = {};
        for (const it of j.existingAnswers ?? []) a[it.questionId] = it.answer;
        setAnswers(a);
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();
  }, [token]);

  async function save() {
    setSaving("saving");
    setError(null);
    const payload = {
      responses: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    };
    const res = await fetch(`${API_BASE_URL}/public/surveys/${token}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setSaving(null);
      setError(await res.text());
      return;
    }
    setSaving("saved");
    setTimeout(() => setSaving(null), 800);
  }

  async function submit() {
    setError(null);
    const payload = {
      responses: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }))
    };
    const res = await fetch(`${API_BASE_URL}/public/surveys/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setSubmitted(await res.json());
  }

  if (error) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Survey</h1>
        <div className="mt-4 rounded border bg-white p-4 text-sm text-red-700">{error}</div>
      </main>
    );
  }

  if (!data) return <main className="mx-auto max-w-xl p-6 text-sm text-gray-600">Loading…</main>;
  if (submitted)
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">Thank you</h1>
        <div className="mt-4 rounded border bg-white p-4 text-sm">
          Submission received.
          <pre className="mt-3 overflow-x-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      </main>
    );

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold">{data.survey.title}</h1>
      <div className="mt-1 text-sm text-gray-600">
        Expires: {new Date(data.expiresAt).toLocaleString()}
      </div>

      <div className="mt-4 grid gap-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded border bg-white p-4">
            <div className="text-sm font-medium">
              {q.text} {q.required ? <span className="text-red-600">*</span> : null}
            </div>
            <div className="mt-3">
              {q.type === "free_text" ? (
                <textarea
                  className="w-full rounded border p-2"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                />
              ) : q.type === "single_choice" || q.type === "likert" ? (
                <div className="grid gap-2">
                  {q.choices.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 rounded border p-3">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === c.value}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: c.value }))}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              ) : q.type === "multi_choice" ? (
                <div className="grid gap-2">
                  {q.choices.map((c) => {
                    const arr: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                    const checked = arr.includes(c.value);
                    return (
                      <label key={c.id} className="flex items-center gap-2 rounded border p-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAnswers((a) => {
                              const curr: string[] = Array.isArray(a[q.id]) ? a[q.id] : [];
                              const next = checked ? curr.filter((x) => x !== c.value) : [...curr, c.value];
                              return { ...a, [q.id]: next };
                            })
                          }
                        />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="w-full rounded border p-2"
                  type="number"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value === "" ? "" : Number(e.target.value) }))}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-white/90 p-3 backdrop-blur">
        <button className="flex-1 rounded border p-3" onClick={save}>
          Save
        </button>
        <button className="flex-1 rounded bg-black p-3 text-white" onClick={submit}>
          Submit
        </button>
      </div>
      {saving ? <div className="mt-2 text-xs text-gray-600">{saving}</div> : null}
    </main>
  );
}

