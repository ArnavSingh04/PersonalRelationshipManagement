import { requireUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
import { logout } from "@/app/actions/auth";
import { Download, LogOut } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <SettingsForm
          profile={
            profile ?? {
              id: user.id,
              full_name: "",
              email: user.email ?? "",
              timezone: "Asia/Kolkata",
              default_follow_up_interval_days: 90,
              birthday_reminder_days_before: 7,
              linkedin_followup_days: 14,
              weekly_digest_enabled: true,
              created_at: "",
              updated_at: "",
            }
          }
        />

        <div className="card p-4 md:p-6">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Your data</h2>
          <p className="mb-3 text-sm text-slate-500">
            RelateLoop never locks your data in. Export everything as CSV any time.
          </p>
          <a href="/api/export" className="btn-secondary">
            <Download size={15} /> Export all data (CSV)
          </a>
        </div>

        <div className="card p-4 md:p-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Account</h2>
          <p className="mb-3 text-sm text-slate-500">Signed in as {user.email}</p>
          <form action={logout}>
            <button type="submit" className="btn-danger">
              <LogOut size={15} /> Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
