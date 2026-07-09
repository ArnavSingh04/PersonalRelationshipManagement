"use client";

import { toast } from "sonner";
import { updateLinkedInStatus } from "@/app/actions/contacts";
import { LINKEDIN_STATUSES } from "@/lib/constants";

export function LinkedInStatusSelect({
  contactId,
  status,
}: {
  contactId: string;
  status: string | null;
}) {
  return (
    <select
      className="input !w-auto !py-1 text-xs"
      defaultValue={status ?? "unknown"}
      onChange={async (e) => {
        const result = await updateLinkedInStatus(contactId, e.target.value);
        if (result.error) toast.error(result.error);
        else toast.success("LinkedIn status updated");
      }}
    >
      {LINKEDIN_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
