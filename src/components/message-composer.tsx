"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateAndSaveDraft, markDraftSent, saveEditedDraft } from "@/app/actions/drafts";
import { logInteraction } from "@/app/actions/interactions";
import { whatsappLink, mailtoLink } from "@/lib/messages";
import { CHANNELS, MESSAGE_REASONS, MESSAGE_TONES } from "@/lib/constants";
import type { Contact, PersonalFact } from "@/lib/types";
import { Copy, ExternalLink, EyeOff, MessageCircle, Send, Sparkles } from "lucide-react";

const COMPOSER_CHANNELS = CHANNELS.filter((c) =>
  ["linkedin", "whatsapp", "email", "other"].includes(c.value)
);

export function MessageComposer({
  contact,
  facts,
  reminderId,
}: {
  contact: Contact;
  facts: PersonalFact[];
  reminderId?: string | null;
}) {
  const [channel, setChannel] = useState("linkedin");
  const [reason, setReason] = useState("check_in");
  const [tone, setTone] = useState("warm");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  // Sensitive facts are excluded by default; user can opt in explicitly.
  const [selectedFacts, setSelectedFacts] = useState<Set<string>>(
    () => new Set(facts.filter((f) => !f.is_sensitive).slice(0, 1).map((f) => f.id))
  );
  const [draftId, setDraftId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggleFact(id: string) {
    setSelectedFacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateAndSaveDraft({
      contact_id: contact.id,
      channel,
      reason,
      tone,
      length,
      fact_ids: [...selectedFacts],
      reminder_id: reminderId ?? null,
    });
    setGenerating(false);
    if ("error" in result) {
      toast.error(result.error ?? "Could not generate draft");
      return;
    }
    setText(result.text);
    setDraftId(result.id);
    toast.success("Draft generated — edit before sending");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    if (draftId) await saveEditedDraft(draftId, text, contact.id);
    toast.success("Copied to clipboard");
  }

  async function handleLogAsSent() {
    if (!text.trim()) return;
    setBusy(true);
    if (draftId) {
      await saveEditedDraft(draftId, text, contact.id);
      await markDraftSent(draftId, contact.id);
    }
    const result = await logInteraction({
      contact_id: contact.id,
      channel: channel === "other" ? "other" : channel,
      message_text: text,
      summary: `Sent ${reason.replace(/_/g, " ")} message`,
    });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Logged as interaction — follow-up rescheduled");
  }

  const waLink = whatsappLink(contact.whatsapp_phone || contact.phone, text);
  const emailLink = mailtoLink(contact.email, "Hello!", text);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="label">Channel</label>
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {COMPOSER_CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Reason</label>
          <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
            {MESSAGE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tone</label>
          <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
            {MESSAGE_TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Length</label>
          <select
            className="input"
            value={length}
            onChange={(e) => setLength(e.target.value as "short" | "medium" | "long")}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label">Personal facts to include</label>
        {facts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No facts saved yet — drafts will use “how you know them” only.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {facts.map((f) => {
              const selected = selectedFacts.has(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFact(f.id)}
                  className={`chip border transition ${
                    selected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                  title={f.value}
                >
                  {f.is_sensitive && <EyeOff size={12} className="text-rose-500" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">
          Sensitive facts (marked <EyeOff size={10} className="inline text-rose-500" />) are
          excluded unless you select them.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="btn-primary"
      >
        <Sparkles size={16} />
        {generating ? "Generating..." : "Generate draft"}
      </button>

      {text && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <textarea
            className="input"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleCopy} className="btn-secondary">
              <Copy size={15} /> Copy
            </button>
            {contact.linkedin_url && (
              <a
                href={contact.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <ExternalLink size={15} /> Open LinkedIn
              </a>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                <MessageCircle size={15} /> Open WhatsApp
              </a>
            )}
            {emailLink && channel === "email" && (
              <a href={emailLink} className="btn-secondary">
                <ExternalLink size={15} /> Open email
              </a>
            )}
            <button
              type="button"
              onClick={handleLogAsSent}
              disabled={busy}
              className="btn-primary"
            >
              <Send size={15} /> {busy ? "Logging..." : "Log as sent"}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            RelateLoop never sends messages for you — copy, open the channel, and send it yourself.
          </p>
        </div>
      )}
    </div>
  );
}
