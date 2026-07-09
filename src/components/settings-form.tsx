"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettings } from "@/app/actions/settings";
import type { Profile } from "@/lib/types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "Asia/Kolkata");
  const [interval, setInterval_] = useState(profile.default_follow_up_interval_days ?? 90);
  const [birthdayDays, setBirthdayDays] = useState(profile.birthday_reminder_days_before ?? 7);
  const [linkedinDays, setLinkedinDays] = useState(profile.linkedin_followup_days ?? 14);
  const [digest, setDigest] = useState(profile.weekly_digest_enabled ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateSettings({
      full_name: fullName || null,
      timezone: timezone || null,
      default_follow_up_interval_days: interval,
      birthday_reminder_days_before: birthdayDays,
      linkedin_followup_days: linkedinDays,
      weekly_digest_enabled: digest,
    });
    setSaving(false);
    if (result.error) toast.error(result.error);
    else toast.success("Settings saved");
  }

  return (
    <div className="card p-4 md:p-6">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Preferences</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Your name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Timezone</label>
          <input
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Asia/Kolkata"
          />
        </div>
        <div>
          <label className="label">Default follow-up interval (days)</label>
          <input
            className="input"
            type="number"
            min={1}
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-400">Applied to new contacts. Default 90.</p>
        </div>
        <div>
          <label className="label">Birthday reminder (days before)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={birthdayDays}
            onChange={(e) => setBirthdayDays(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">LinkedIn request follow-up (days)</label>
          <input
            className="input"
            type="number"
            min={1}
            value={linkedinDays}
            onChange={(e) => setLinkedinDays(Number(e.target.value))}
          />
          <p className="mt-1 text-xs text-slate-400">
            Remind me if a request is still pending after this long.
          </p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={digest}
              onChange={(e) => setDigest(e.target.checked)}
            />
            Weekly relationship digest
          </label>
        </div>
      </div>
      <button type="button" onClick={handleSave} disabled={saving} className="btn-primary mt-5">
        {saving ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
