"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [status, setStatus] = useState<JoiningChoice>("JOINED");
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
    <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-foreground">
        New joining outcome
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value as JoiningChoice)}
          className="mt-1 min-h-11 md:min-h-9 w-full "
        >
          <option value="JOINED">Joined</option>
          <option value="DEFERRED">Deferred</option>
          <option value="DID_NOT_JOIN">Did not join</option>
        </Select>
      </label>
      {needsDate ? (
        <label className="text-sm font-medium text-foreground">
          {status === "JOINED" ? "Actual joining date" : "Revised joining date"}
          <Input type="date" value={joiningDate}
            onChange={(event) => setJoiningDate(event.target.value)}
            className="mt-1 min-h-11 w-full  md:min-h-9" />
        </label>
      ) : null}
      {needsReason ? (
        <label className="text-sm font-medium text-foreground sm:col-span-2">
          Outcome reason
          <Textarea rows={2} value={reason} maxLength={2000}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 min-h-11 w-full  md:min-h-9" />
        </label>
      ) : null}
      {corrected ? (
        <label className="text-sm font-medium text-foreground sm:col-span-2">
          Reason for correcting the recorded outcome
          <Textarea rows={2} value={correctionReason} maxLength={2000}
            onChange={(event) => setCorrectionReason(event.target.value)}
            className="mt-1 min-h-11 w-full  md:min-h-9" />
        </label>
      ) : null}
      <div className="sm:col-span-2">
        <Button variant="primary" type="button" disabled={busy} onClick={() => void save()}
          className="min-h-11 md:min-h-9">
          {busy ? "Saving..." : corrected ? "Confirm corrected outcome" : "Confirm joining outcome"}
        </Button>
        {error ? <p role="alert" className="mt-2 text-sm text-foreground">{error}</p> : null}
      </div>
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={busy}
        title={"Record "+status.replaceAll("_"," ")+" for this accepted offer?"}
        description="Changes are kept in joining history."
        confirmLabel={corrected?"Confirm corrected outcome":"Confirm joining outcome"}
        onConfirm={()=>void save(true)}/>
    </div>
  );
}
