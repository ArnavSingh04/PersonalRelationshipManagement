"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  checkDuplicates,
  importContacts,
  type DuplicateInfo,
  type ImportRow,
} from "@/app/actions/import";
import { FileUp, Upload } from "lucide-react";

const NUMERIC_FIELDS = new Set([
  "importance_score",
  "closeness_score",
  "birthday_day",
  "birthday_month",
  "birthday_year",
  "follow_up_interval_days",
]);

const TEMPLATE_COLUMNS =
  "full_name,preferred_name,role_title,company,city,country,email,phone,whatsapp_phone,linkedin_url,relationship_type,source,how_i_know_them,relationship_context,linkedin_status,importance_score,closeness_score,birthday_day,birthday_month,birthday_year,last_contacted_at,follow_up_interval_days,notes,tags,personal_facts";

export function CsvImport() {
  const router = useRouter();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [decisions, setDecisions] = useState<Record<number, "create" | "skip">>({});
  const [invalidRows, setInvalidRows] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [checking, setChecking] = useState(false);

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: async (result) => {
        const parsed: ImportRow[] = (result.data as Record<string, string>[]).map((raw) => {
          const row: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(raw)) {
            const v = value?.trim();
            if (!v) continue;
            row[key] = NUMERIC_FIELDS.has(key) ? Number(v) : v;
          }
          return row as ImportRow;
        });

        const invalid = parsed
          .map((r, i) => (!r.full_name?.trim() ? i : -1))
          .filter((i) => i >= 0);
        setInvalidRows(invalid);
        setRows(parsed);

        setChecking(true);
        try {
          const dups = await checkDuplicates(parsed);
          setDuplicates(dups);
          const initial: Record<number, "create" | "skip"> = {};
          for (const d of dups) initial[d.rowIndex] = "skip";
          for (const i of invalid) initial[i] = "skip";
          setDecisions(initial);
        } finally {
          setChecking(false);
        }
      },
      error: () => toast.error("Could not parse that CSV file"),
    });
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await importContacts(rows, decisions);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} row(s) failed: ${result.errors[0]}`);
      }
      toast.success(`Imported ${result.created} contact(s), skipped ${result.skipped}`);
      router.push("/contacts");
    } finally {
      setImporting(false);
    }
  }

  const dupByRow = new Map(duplicates.map((d) => [d.rowIndex, d]));

  if (rows.length === 0) {
    return (
      <div className="card p-6">
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-6 py-12 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
          <FileUp size={32} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">
            Click to choose a CSV file
          </span>
          <span className="text-xs text-slate-500">
            Required column: full_name. Everything else is optional.
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
        <details className="mt-4 text-sm text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">
            Supported columns
          </summary>
          <p className="mt-2 break-all rounded-lg bg-slate-50 p-3 font-mono text-xs">
            {TEMPLATE_COLUMNS}
          </p>
          <p className="mt-2 text-xs">
            <code>tags</code>: comma/semicolon separated. <code>personal_facts</code>:{" "}
            <code>label: value; label: value</code>.
          </p>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-slate-700">
          <strong>{rows.length}</strong> row(s) parsed
          {checking
            ? " — checking for duplicates..."
            : ` — ${duplicates.length} possible duplicate(s), ${invalidRows.length} invalid`}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => {
              const dup = dupByRow.get(i);
              const invalid = invalidRows.includes(i);
              return (
                <tr key={i} className={decisions[i] === "skip" ? "opacity-50" : ""}>
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">
                    {r.full_name || <span className="text-red-600">missing</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.company ?? "—"}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {[r.city, r.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.email ?? "—"}</td>
                  <td className="px-3 py-2">
                    {invalid ? (
                      <span className="chip bg-red-50 text-red-600">invalid</span>
                    ) : dup ? (
                      <span
                        className="chip bg-amber-50 text-amber-700"
                        title={`Matches ${dup.existingName} on ${dup.matchedOn}`}
                      >
                        duplicate? ({dup.matchedOn})
                      </span>
                    ) : (
                      <span className="chip bg-emerald-50 text-emerald-700">new</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {!invalid && (
                      <select
                        className="input !w-auto !py-1 text-xs"
                        value={decisions[i] ?? "create"}
                        onChange={(e) =>
                          setDecisions((prev) => ({
                            ...prev,
                            [i]: e.target.value as "create" | "skip",
                          }))
                        }
                      >
                        <option value="create">
                          {dup ? "Create anyway" : "Create"}
                        </option>
                        <option value="skip">Skip</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleImport}
          disabled={importing || checking}
          className="btn-primary"
        >
          <Upload size={16} />
          {importing ? "Importing..." : "Import contacts"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRows([]);
            setDuplicates([]);
            setDecisions({});
            setInvalidRows([]);
          }}
          className="btn-secondary"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
