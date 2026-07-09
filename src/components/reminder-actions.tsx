"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cancelReminder, completeReminder, snoozeReminder } from "@/app/actions/reminders";
import { InteractionForm } from "@/components/interaction-form";
import { Check, Clock, X } from "lucide-react";

export function ReminderActions({
  reminderId,
  contactId,
}: {
  reminderId: string;
  contactId: string | null;
}) {
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleComplete() {
    setBusy(true);
    const result = await completeReminder(reminderId, contactId);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Reminder completed");
    if (contactId) setShowLogPrompt(true);
  }

  async function handleSnooze(days: number) {
    setBusy(true);
    const result = await snoozeReminder(reminderId, days, contactId);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else toast.success(`Snoozed for ${days} day${days > 1 ? "s" : ""}`);
  }

  async function handleCancel() {
    setBusy(true);
    const result = await cancelReminder(reminderId, contactId);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else toast.success("Reminder cancelled");
  }

  if (showLogPrompt && contactId) {
    return (
      <div className="mt-2 w-full">
        <p className="mb-2 text-xs font-medium text-slate-600">
          Did you reach out? Log the interaction to reschedule the next follow-up.
        </p>
        <InteractionForm
          contactId={contactId}
          defaultOpen
          onLogged={() => setShowLogPrompt(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={handleComplete}
        title="Complete"
        className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50"
      >
        <Check size={17} />
      </button>
      <div className="group relative">
        <button
          type="button"
          disabled={busy}
          title="Snooze"
          className="rounded-md p-2 text-amber-600 hover:bg-amber-50"
        >
          <Clock size={17} />
        </button>
        <div className="invisible absolute right-0 z-10 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg group-hover:visible">
          {[1, 3, 7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleSnooze(d)}
              className="block w-full px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              {d} day{d > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={handleCancel}
        title="Cancel reminder"
        className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <X size={17} />
      </button>
    </div>
  );
}
