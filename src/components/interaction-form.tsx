"use client";

import { useState } from "react";
import { toast } from "sonner";
import { logInteraction } from "@/app/actions/interactions";
import { CHANNELS } from "@/lib/constants";
import { Plus } from "lucide-react";

export function InteractionForm({
  contactId,
  onLogged,
  defaultOpen = false,
  prefillMessage,
  prefillChannel,
}: {
  contactId: string;
  onLogged?: () => void;
  defaultOpen?: boolean;
  prefillMessage?: string;
  prefillChannel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [channel, setChannel] = useState(prefillChannel ?? "linkedin");
  const [direction, setDirection] = useState("outbound");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState("");
  const [messageText, setMessageText] = useState(prefillMessage ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await logInteraction({
      contact_id: contactId,
      channel,
      direction,
      interaction_at: new Date(date + "T12:00:00").toISOString(),
      summary: summary || null,
      message_text: messageText || null,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Interaction logged — follow-up rescheduled");
    setSummary("");
    setMessageText("");
    setOpen(false);
    onLogged?.();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        <Plus size={16} /> Log interaction
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Channel</label>
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Direction</label>
          <select className="input" value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="outbound">I reached out</option>
            <option value="inbound">They reached out</option>
            <option value="mutual">Mutual / meeting</option>
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Summary</label>
        <input
          className="input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Caught up about their new role"
        />
      </div>
      <div>
        <label className="label">Message text (optional)</label>
        <textarea
          className="input"
          rows={3}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Paste the message you sent, for future context"
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Log interaction"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
