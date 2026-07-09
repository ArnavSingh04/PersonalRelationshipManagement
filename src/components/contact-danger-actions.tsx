"use client";

import { useState } from "react";
import { archiveContact, deleteContact, unarchiveContact } from "@/app/actions/contacts";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";

export function ContactDangerActions({
  contactId,
  archived,
}: {
  contactId: string;
  archived: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {archived ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await unarchiveContact(contactId);
            setBusy(false);
          }}
          className="btn-secondary"
        >
          <ArchiveRestore size={15} /> Unarchive
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await archiveContact(contactId);
          }}
          className="btn-secondary"
        >
          <Archive size={15} /> Archive
        </button>
      )}
      {confirmDelete ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await deleteContact(contactId);
            }}
            className="btn-danger"
          >
            <Trash2 size={15} /> Really delete?
          </button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="btn-secondary">
            Keep
          </button>
        </>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger">
          <Trash2 size={15} /> Delete permanently
        </button>
      )}
    </div>
  );
}
