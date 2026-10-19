"use client";

import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {friendlyApiError} from "@/lib/friendly-error";
import { canRecordTpoOfferAction, parseTpoOfferExpiryIstInput, TPO_OFFER_ACTIONS, type TpoOfferAction } from "@/modules/placements/tpo-offer-lifecycle-model";

type CandidateOffer = {
  id: string;
  label: string;
  status: "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  joiningStatus: "PENDING" | "JOINED" | "DEFERRED" | "DID_NOT_JOIN" | null;
};

export function TpoOfferLifecyclePanel({
  jobId,
  choices,
}: {
  jobId: string;
  choices: readonly CandidateOffer[];
}) {
  const router = useRouter();
  const {run}=useGuardedAction({timeoutMs:35000});
  const [reviewed,setReviewed]=useState(false);
  const [action, setAction] = useState<TpoOfferAction>("EXTEND");
  const [ids, setIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const eligible = choices.filter((choice) =>
    canRecordTpoOfferAction(action, choice.status, choice.joiningStatus),
  );
  const selected = eligible.filter((choice) => ids.includes(choice.id));
  const statuses = [...new Set(selected.map((item) => item.status))];
  const parsedExpiry = parseTpoOfferExpiryIstInput(expiresAt);
  const valid = selected.length > 0 && selected.length === ids.length &&
    selected.length <= 200 && statuses.length === 1 &&
    reason.trim().length >= 10 &&
    (action !== "EXTEND" || parsedExpiry !== null) &&
    (action !== "RECORD_JOINED" || Boolean(joiningDate));

  function select(id: string, checked: boolean) {
    setIds((current) => checked
      ? current.includes(id) || current.length >= 200
        ? current : [...current, id]
      : current.filter((value) => value !== id));
  }

  async function submit() {
    if (!valid || busy) return;
    if(!reviewed)return;
    await run(async()=>{
    setBusy(true);
    setNotice(null);
    try {
      const payload = await apiFetch<{updated?:number}>(
        "/api/placements/jobs/" + encodeURIComponent(jobId) + "/offers/lifecycle",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            confirmed: true,
            action,
            offerIds: selected.map((choice) => choice.id),
            expectedStatus: statuses[0],
            reason: reason.trim(),
            ...(action === "EXTEND" ? {
              expiresAt: parsedExpiry,
            } : {}),
            ...(action === "RECORD_JOINED" ? { joiningDate } : {}),
          }),
        },
      );

      setNotice(String(payload?.updated ?? 0) + " offer(s) updated and audited.");
      setIds([]);
      setReason("");
      setReviewed(false);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : friendlyApiError({}));
    } finally {
      setBusy(false);
    }
    });
  }

  if (choices.length === 0) return null;
  return (
    <section className="space-y-4 border-b border-border pb-6" aria-label="TPO verified offer lifecycle">
      <div>
        <h3 className="text-base font-semibold text-foreground">Verified offer lifecycle</h3>
        <p className="mt-1 text-sm leading-6 text-body">
          Record an expiry extension, evidence-backed learner response, joining
          confirmation or employer withdrawal for up to 200 offers.
          Changing a learner response here requires independent confirmation evidence.
        </p>
      </div>
      <label className="block text-sm font-semibold text-foreground">
        Administrative action
        <Select
          value={action}
          disabled={busy}
          onChange={(event) => {
            setAction(event.target.value as TpoOfferAction);
            setIds([]);
            setReviewed(false);
          }}
          className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-normal"
        >
          {TPO_OFFER_ACTIONS.map((value) => (
            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
          ))}
        </Select>
      </label>
      {eligible.length === 0 ? (
        <p role="status" className="text-sm text-body">
          No offers currently match this action. Nothing will be changed.
        </p>
      ) : (
        <div tabIndex={0} role="group" aria-label="Eligible offers, scroll for more" className="max-h-56 min-h-0 divide-y divide-border overflow-auto overscroll-contain rounded-[var(--lms-canvas-radius)] border border-border px-2 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
          {eligible.map((offer) => (
            <label key={offer.id} className="flex min-h-11 items-center gap-3 px-2 text-sm hover:bg-muted md:min-h-9">
              <Checkbox
                checked={ids.includes(offer.id)}
                disabled={busy || (ids.length >= 200 && !ids.includes(offer.id)) ||
                  (statuses.length > 0 && !statuses.includes(offer.status))}
                onChange={(event) => select(offer.id, event.target.checked)}
              />
              <span className="font-medium text-foreground">{offer.label}</span>
              <span className="text-muted-foreground">{offer.status}</span>
            </label>
          ))}
        </div>
      )}
      {action === "EXTEND" ? (
        <label className="block text-sm font-semibold">
          New expiry (IST)
          <DateInput
            mode="datetime-local"
            value={expiresAt}
            disabled={busy}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          />
        </label>
      ) : null}
      {action === "RECORD_JOINED" ? (
        <label className="block text-sm font-semibold">
          Confirmed joining date
          <DateInput
            mode="date"
            value={joiningDate}
            disabled={busy}
            onChange={(event) => setJoiningDate(event.target.value)}
            className="mt-2 block min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface p-2"
          />
        </label>
      ) : null}
      <label className="block text-sm font-semibold text-foreground">
        Mandatory evidence / reason (10–1200 characters)
        <Textarea
          rows={3}
          maxLength={1200}
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
          className="mt-2 block w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm font-normal text-foreground"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-body">{ids.length} / 200 selected</span>
        <label className="flex items-start gap-2 text-sm text-body">
          <Checkbox checked={reviewed} disabled={busy}
            onChange={event=>setReviewed(event.target.checked)} className="mt-1 h-4 w-4 accent-primary"/>
          I reviewed the {selected.length} affected offer(s) and supporting evidence.
          This is an audited administrative action, not a learner self-response.
        </label>
        <button
          type="button"
          disabled={!valid || busy || !reviewed}
          onClick={() => void submit()}
          className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-primary-foreground"
        >
          {busy ? "Recording..." : "Review and confirm action"}
        </button>
      </div>
      {notice ? <p role={notice.includes("updated and audited")?"status":"alert"} className="text-sm text-body">{notice}</p> : null}
    </section>
  );
}
