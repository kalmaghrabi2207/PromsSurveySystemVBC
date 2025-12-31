export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold">PROMs/PREMs Portal (MVP)</h1>
      <div className="mt-6 grid gap-3">
        <a className="rounded border p-4 hover:bg-gray-50" href="/admin/login">
          Admin Login
        </a>
        <p className="text-sm text-gray-600">
          Patient links look like <code className="rounded bg-gray-100 px-1">/s/&lt;token&gt;</code>.
        </p>
      </div>
    </main>
  );
}
