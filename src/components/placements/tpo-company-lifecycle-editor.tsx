"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

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
  const [reviewAction,setReviewAction]=useState<"ARCHIVE"|"RESTORE"|"EDIT_TRUST"|null>(null);

  async function submit(action: "ARCHIVE" | "RESTORE" | "EDIT_TRUST") {
    if (busy) return;
    if (reason.trim().length < 8) {
      setError("Enter an explanation of at least 8 characters.");
      return;
    }
    if(reviewAction!==action){setReviewAction(action);setError(null);return;}
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
      setReason("");setReviewAction(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed. Refresh to verify the current state.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 border-b border-border pb-6">
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
        <Textarea
          value={reason} onChange={(event) => {setReviewAction(null);setReason(event.target.value);}}
          disabled={busy} maxLength={500} rows={3}
          className="mt-2 block w-full"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        {company.status === "ACTIVE" ? (
          <>
            <Button variant="secondary" type="button" disabled={busy || reason.trim().length < 8}
              onClick={() => void submit("EDIT_TRUST")}
              >
              {company.isTrusted ? "Remove trust" : "Mark trusted"}
            </Button>
            <Button variant="secondary" type="button" disabled={busy || reason.trim().length < 8}
              onClick={() => void submit("ARCHIVE")}
              >
              Archive relationship
            </Button>
          </>
        ) : (
          <Button variant="secondary" type="button" disabled={busy || reason.trim().length < 8}
            onClick={() => void submit("RESTORE")}
            >
            Restore relationship
          </Button>
        )}
      </div>
      {reviewAction?<div role="group" aria-label="Confirm company change" className="rounded-[var(--lms-canvas-radius)] border border-border bg-muted p-3 text-sm">
        <p className="text-body">Confirm: {reviewAction==="EDIT_TRUST"
          ?company.isTrusted?"remove trust from ":"mark trusted ":""+(reviewAction==="ARCHIVE"?"archive ":"restore ")}{company.name}?
          This changes only this college&apos;s relationship and is audited.</p>
        <div className="mt-2 flex gap-2">
          <Button type="button" disabled={busy} onClick={()=>void submit(reviewAction)}
            >Confirm change</Button>
          <Button variant="secondary" type="button" disabled={busy} onClick={()=>setReviewAction(null)}
            >Cancel</Button>
        </div>
      </div>:null}
      {busy ? <p role="status" className="text-sm text-body">Saving change…</p> : null}
      {message ? <p role="status" className="text-sm text-body">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
