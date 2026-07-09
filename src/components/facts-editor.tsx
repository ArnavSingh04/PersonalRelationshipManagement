"use client";

import { useState } from "react";
import { toast } from "sonner";
import { addFact, deleteFact, updateFact } from "@/app/actions/facts";
import { FACT_TYPES, labelFor } from "@/lib/constants";
import type { PersonalFact } from "@/lib/types";
import { EyeOff, Plus, Trash2 } from "lucide-react";

export function FactsEditor({
  contactId,
  facts,
}: {
  contactId: string;
  facts: PersonalFact[];
}) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [factType, setFactType] = useState("interest");
  const [sensitive, setSensitive] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!label.trim() || !value.trim()) {
      toast.error("Label and value are required");
      return;
    }
    setSaving(true);
    const result = await addFact({
      contact_id: contactId,
      label: label.trim(),
      value: value.trim(),
      fact_type: factType,
      is_sensitive: sensitive,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Fact saved");
    setLabel("");
    setValue("");
    setSensitive(false);
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {facts.length === 0 && !adding && (
        <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No personal facts yet. Save the details that make a follow-up warm:
          interests, family, goals, past conversations.
        </p>
      )}

      <ul className="space-y-2">
        {facts.map((f) => (
          <li
            key={f.id}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{f.label}</span>
                <span className="chip bg-slate-100 text-slate-500">
                  {labelFor(FACT_TYPES, f.fact_type)}
                </span>
                {f.is_sensitive && (
                  <span className="chip bg-rose-50 text-rose-600">
                    <EyeOff size={12} /> sensitive
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-600">{f.value}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                title={f.is_sensitive ? "Mark as not sensitive" : "Mark as sensitive"}
                onClick={async () => {
                  await updateFact(f.id, contactId, { is_sensitive: !f.is_sensitive });
                }}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <EyeOff size={15} />
              </button>
              <button
                type="button"
                title="Delete fact"
                onClick={async () => {
                  await deleteFact(f.id, contactId);
                  toast.success("Fact deleted");
                }}
                className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {adding ? (
        <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Label</label>
              <input
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Hobby"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={factType}
                onChange={(e) => setFactType(e.target.value)}
              >
                {FACT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Value</label>
            <input
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Plays badminton every weekend"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={sensitive}
              onChange={(e) => setSensitive(e.target.checked)}
            />
            Sensitive — never include in message drafts by default
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save fact"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn-secondary">
          <Plus size={16} /> Add fact
        </button>
      )}
    </div>
  );
}
