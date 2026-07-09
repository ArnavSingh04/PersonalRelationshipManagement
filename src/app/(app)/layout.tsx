import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Sidebar, BottomNav, FloatingAddButton } from "@/components/nav";
import { HeartHandshake, LogOut, Plus } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="flex items-center gap-2 px-5 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <HeartHandshake size={18} />
            </div>
            <span className="text-lg font-semibold text-slate-900">RelateLoop</span>
          </div>
          <div className="px-3 pb-2">
            <Link href="/contacts/new" className="btn-primary w-full">
              <Plus size={16} /> Add contact
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
          <div className="border-t border-slate-200 p-3">
            <p className="truncate px-3 pb-2 text-xs text-slate-400">{user.email}</p>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 pb-24 md:pb-8">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">{children}</div>
      </main>

      <BottomNav />
      <FloatingAddButton />
    </div>
  );
}
