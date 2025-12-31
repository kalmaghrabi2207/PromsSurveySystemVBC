export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <a href="/admin/dashboard" className="font-semibold">
            Admin
          </a>
          <nav className="flex gap-4 text-sm">
            <a href="/admin/dashboard" className="hover:underline">
              Dashboard
            </a>
            <a href="/admin/surveys" className="hover:underline">
              Surveys
            </a>
            <a href="/admin/import" className="hover:underline">
              Import
            </a>
            <a href="/admin/assignments" className="hover:underline">
              Assignments
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}

