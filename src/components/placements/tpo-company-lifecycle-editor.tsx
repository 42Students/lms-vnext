"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  name: string; status: string; isTrusted: boolean;
  updatedAt: string; companyId: string;
};
export function TpoCompanyLifecycleEditor({ company }: { company: Company }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(action: "ARCHIVE" | "RESTORE" | "EDIT_TRUST") {
    if (busy) return;
    if (reason.trim().length < 8) {
      setError("Enter an explanation of at least 8 characters.");
      return;
    }
    const verb = action === "EDIT_TRUST"
      ? (company.isTrusted ? "remove trust from" : "mark trusted")
      : action === "ARCHIVE" ? "archive" : "restore";
    if (!window.confirm("Confirm: " + verb + " " + company.name +
      "? This changes only this college's relationship and is audited.")) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/placements/tpo/companies/lifecycle", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          companyId: company.companyId,
          expectedUpdatedAt: company.updatedAt,
          action, confirmed: true, reason: reason.trim(),
          ...(action === "EDIT_TRUST" ? { nextTrusted: !company.isTrusted } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Company relationship was not updated");
      }
      setMessage("Saved. Reloading current relationship details.");
      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed. Refresh to verify the current state.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Manage college relationship</h2>
      <p className="text-sm text-body">
        This company&apos;s global name and domain are shared across colleges and cannot
        be edited here. Only your college&apos;s trust and archive state can change.
        Active draft/published drives block archiving.
      </p>
      <p className="text-sm text-body">
        Status: <strong>{company.status}</strong> · Trusted: <strong>{company.isTrusted ? "Yes" : "No"}</strong>
      </p>
      <label className="block text-sm font-semibold text-foreground">
        Reason for change
        <textarea
          value={reason} onChange={(event) => setReason(event.target.value)}
          disabled={busy} maxLength={500} rows={3}
          className="mt-2 block w-full rounded-md border border-border bg-surface p-3 text-sm font-normal"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        {company.status === "ACTIVE" ? (
          <>
            <button type="button" disabled={busy || reason.trim().length < 8}
              onClick={() => void submit("EDIT_TRUST")}
              className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
              {company.isTrusted ? "Remove trust" : "Mark trusted"}
            </button>
            <button type="button" disabled={busy || reason.trim().length < 8}
              onClick={() => void submit("ARCHIVE")}
              className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
              Archive relationship
            </button>
          </>
        ) : (
          <button type="button" disabled={busy || reason.trim().length < 8}
            onClick={() => void submit("RESTORE")}
            className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-50">
            Restore relationship
          </button>
        )}
      </div>
      {busy ? <p role="status" className="text-sm text-body">Saving change…</p> : null}
      {message ? <p role="status" className="text-sm text-body">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
