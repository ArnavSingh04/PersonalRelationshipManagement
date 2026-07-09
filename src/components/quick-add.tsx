"use client";

import { useState } from "react";
import { ContactForm } from "@/components/contact-form";
import { Wand2 } from "lucide-react";

type Parsed = {
  full_name?: string;
  company?: string;
  city?: string;
  how_i_know_them?: string;
  relationship_context?: string;
  notes?: string;
  follow_up_interval_days?: number;
};

/**
 * Heuristic parser for freeform quick-capture notes, e.g.
 * "Met Karan at the React meetup. He works at Razorpay, lives in Bangalore,
 *  likes cycling, and said he's interested in infra roles. Follow up in 2 months."
 */
function parseNote(text: string): Parsed {
  const parsed: Parsed = { notes: text.trim() };

  const nameMatch =
    text.match(/(?:met|talked to|spoke with|connected with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ??
    text.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (nameMatch) parsed.full_name = nameMatch[1];

  const companyMatch = text.match(/works? (?:at|for)\s+([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*)?)/i);
  if (companyMatch) parsed.company = companyMatch[1].replace(/[.,]$/, "");

  const cityMatch = text.match(/(?:lives? in|based (?:in|out of)|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (cityMatch) parsed.city = cityMatch[1].replace(/[.,]$/, "");

  const howMatch = text.match(/(?:met .*? (at|through|via|during)\s+)([^.,]+)/i);
  if (howMatch) parsed.how_i_know_them = `Met ${howMatch[1]} ${howMatch[2].trim()}`;

  const interestMatch = text.match(/(?:likes?|loves?|enjoys?|interested in|into)\s+([^.,]+)/i);
  if (interestMatch) parsed.relationship_context = interestMatch[0].trim();

  const followMatch = text.match(/follow up in\s+(\d+)\s+(day|week|month)s?/i);
  if (followMatch) {
    const n = Number(followMatch[1]);
    const unit = followMatch[2].toLowerCase();
    parsed.follow_up_interval_days =
      unit === "day" ? n : unit === "week" ? n * 7 : n * 30;
  }

  return parsed;
}

export function QuickAdd() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);

  if (parsed) {
    return (
      <>
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          Review the extracted fields below, fix anything that looks off, then save.
        </div>
        <ContactForm
          initialValues={{
            full_name: parsed.full_name ?? "",
            company: parsed.company ?? "",
            city: parsed.city ?? "",
            how_i_know_them: parsed.how_i_know_them ?? "",
            relationship_context: parsed.relationship_context ?? "",
            notes: parsed.notes ?? "",
            follow_up_interval_days: parsed.follow_up_interval_days ?? 90,
          }}
        />
      </>
    );
  }

  return (
    <div className="card p-4 md:p-6">
      <textarea
        className="input"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Met Karan at the React meetup. He works at Razorpay, lives in Bangalore, likes cycling, and said he's interested in infra roles. Follow up in 2 months."
      />
      <p className="mt-2 text-xs text-slate-400">
        Tip: on your phone, tap the mic on the keyboard and dictate the note.
      </p>
      <button
        type="button"
        disabled={!text.trim()}
        onClick={() => setParsed(parseNote(text))}
        className="btn-primary mt-4"
      >
        <Wand2 size={16} /> Extract fields
      </button>
    </div>
  );
}
