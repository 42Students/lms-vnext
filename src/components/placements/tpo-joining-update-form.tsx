"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Disclosure } from "@/components/ui/disclosure";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";

type JoiningChoice = "JOINED" | "DEFERRED" | "DID_NOT_JOIN";

export function TpoJoiningUpdateForm({
  offerId,
  initialStatus,
  initialJoiningDate,
}: {
  offerId: string;
  initialStatus: string;
  initialJoiningDate: string | null;
}) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:40000});
  const [status, setStatus] = useState<JoiningChoice>(
    initialStatus === "DEFERRED" || initialStatus === "DID_NOT_JOIN" ? initialStatus : "JOINED");
  const [joiningDate, setJoiningDate] = useState(initialJoiningDate ?? "");
  const [reason, setReason] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error, setError] = useState<string | null>(null);
  const corrected = initialStatus !== "PENDING";
  const needsDate = status === "JOINED" || status === "DEFERRED";
  const needsReason = status !== "JOINED";

  async function save(confirmed=false) {
    if (busy) return;
    if ((needsDate && !joiningDate) ||
        (needsReason && !reason.trim()) ||
        (corrected && !correctionReason.trim())) {
      setError("Complete the required date, reason and correction fields.");
      return;
    }

    // A recorded joining or corrected outcome must never bypass its explicit
    // confirmation dialog; a rejected/cancelled confirmation keeps form values.
    if (!confirmed) {
      setConfirmOpen(true);
      return;
    }
    try {
      await run(async()=>{
      setBusy(true);
      setError(null);
      try {
        await apiFetch(
          "/api/placements/offers/" + encodeURIComponent(offerId) + "/joining",
          {
            method: "PUT",
            credentials: "same-origin",
            timeoutMs: 35000,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status,
              joiningDate: needsDate ? joiningDate : null,
              reason: needsReason ? reason.trim() : null,
              correctionReason: corrected ? correctionReason.trim() : null,
            }),
          },
        );
        setReason("");
        setCorrectionReason("");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : friendlyApiError({}));
      } finally {
        setBusy(false);
        setConfirmOpen(false);
      }
      });
    } catch(caught) {
      setBusy(false);
      setConfirmOpen(false);
      setError(caught instanceof Error ? caught.message : friendlyApiError({}));
    }
  }

  return (
    <Disclosure title={corrected?"Correct joining outcome":"Record joining outcome"} defaultOpen={!corrected} className="mt-3 min-w-0 border-t border-border pt-2" contentClassName="grid min-w-0 grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
      <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
        New joining outcome
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as JoiningChoice)}
          className="mt-1 min-h-11 w-full min-w-0 md:min-h-9"
        >
          <option value="JOINED">Joined</option>
          <option value="DEFERRED">Deferred</option>
          <option value="DID_NOT_JOIN">Did not join</option>
        </Select>
      </label>
      {needsDate ? (
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {status === "JOINED" ? "Actual joining date" : "Revised joining date"}
          <Input type="date" required value={joiningDate}
            onChange={(event) => setJoiningDate(event.target.value)}
            className="mt-1 min-h-11 w-full min-w-0 md:min-h-9" />
        </label>
      ) : null}
      {needsReason ? (
        <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Outcome reason
          <Textarea rows={2} required value={reason} maxLength={2000}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 min-h-28 w-full" />
        </label>
      ) : null}
      {corrected ? (
        <label className="sm:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Reason for correcting the recorded outcome
          <Textarea rows={2} required value={correctionReason} maxLength={2000}
            onChange={(event) => setCorrectionReason(event.target.value)}
            className="mt-1 min-h-28 w-full" />
        </label>
      ) : null}
      <div className="sm:col-span-2">
        <Button variant="primary" type="button" disabled={busy} onClick={() => void save()}
          className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
          {busy ? "Saving..." : corrected ? "Confirm corrected outcome" : "Confirm joining outcome"}
        </Button>
        {error ? <div className="mt-3"><InlineNotice tone="error" role="alert" message={error}/></div> : null}
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy)setConfirmOpen(next);}} pending={busy}
        title={"Record "+status.replaceAll("_"," ")+" for this accepted offer?"}
        description={"Changes are kept in joining history. "+status.replaceAll("_"," ")+
          (needsDate&&joiningDate?" · "+joiningDate:"")+(corrected?" · Correcting a recorded outcome.":"")}
        confirmLabel={corrected?"Confirm corrected outcome":"Confirm joining outcome"}
        confirmVariant={status==="DID_NOT_JOIN"?"danger":"primary"}
        onConfirm={()=>void save(true)}/>
    </Disclosure>
  );
}
