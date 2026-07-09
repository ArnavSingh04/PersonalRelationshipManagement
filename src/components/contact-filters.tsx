"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RELATIONSHIP_TYPES, LINKEDIN_STATUSES } from "@/lib/constants";
import { Search } from "lucide-react";

export function ContactFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/contacts?${next.toString()}`);
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) setParam("q", q);
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search name, company, city, notes, facts, tags..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className="input !w-auto"
          value={params.get("type") ?? ""}
          onChange={(e) => setParam("type", e.target.value)}
        >
          <option value="">All types</option>
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          className="input !w-auto"
          value={params.get("linkedin") ?? ""}
          onChange={(e) => setParam("linkedin", e.target.value)}
        >
          <option value="">Any LinkedIn status</option>
          {LINKEDIN_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          className="input !w-auto"
          value={params.get("due") ?? ""}
          onChange={(e) => setParam("due", e.target.value)}
        >
          <option value="">Any follow-up</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due this week</option>
        </select>
        <select
          className="input !w-auto"
          value={params.get("importance") ?? ""}
          onChange={(e) => setParam("importance", e.target.value)}
        >
          <option value="">Any importance</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>Importance {n}+</option>
          ))}
        </select>
        <select
          className="input !w-auto"
          value={params.get("sort") ?? "name"}
          onChange={(e) => setParam("sort", e.target.value)}
        >
          <option value="name">Sort: name</option>
          <option value="last_contacted">Sort: last contacted</option>
          <option value="next_follow_up">Sort: next follow-up</option>
          <option value="birthday">Sort: birthday</option>
          <option value="urgency">Sort: urgency score</option>
        </select>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={params.get("archived") === "1"}
            onChange={(e) => setParam("archived", e.target.checked ? "1" : "")}
          />
          Archived
        </label>
      </div>
    </div>
  );
}
