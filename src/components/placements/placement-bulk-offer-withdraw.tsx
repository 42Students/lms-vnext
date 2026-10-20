"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import type { BulkOfferWithdrawalResult } from "@/modules/placements/bulk-offer-withdrawal-model";

type Choice = {
  id: string;
  label: string;
  status: "ISSUED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";
  joiningStatus: "PENDING" | "JOINED" | "DEFERRED" | "DID_NOT_JOIN" | null;
};

export function PlacementBulkOfferWithdraw({
  jobId,
  choices,
}: {
  jobId: string;
  choices: readonly Choice[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkOfferWithdrawalResult[]>([]);
  const available = choices.filter((item) =>
    (item.status === "ISSUED" || item.status === "ACCEPTED") &&
    (item.status !== "ACCEPTED" ||
      item.joiningStatus === null || item.joiningStatus === "PENDING"),
  );

  function change(id: string, checked: boolean) {
    setSelected((current) => checked
      ? current.includes(id) || current.length >= 50
        ? current
        : [...current, id]
      : current.filter((item) => item !== id));
  }

  async function submit() {
    if (busy || selected.length === 0 || selected.length > 50 || reason.trim().length < 8) {
      setError("Choose at least one offer and enter a reason of at least 8 characters.");
      return;
    }
    const offers = selected.flatMap((id) => {
      const choice = available.find((item) => item.id === id);
      if (!choice || (choice.status !== "ISSUED" && choice.status !== "ACCEPTED")) return [];
      return [{ id, expectedStatus: choice.status }];
    });
    if (offers.length !== selected.length) {
      setError("Some selected offers changed. Refresh before continuing.");
      return;
    }
    if (!window.confirm(
      "Withdraw " + offers.length + " offer(s)? This is a durable status change. " +
      "Accepted offers are included only while joining is pending. Learners cannot be " +
      "accepted or declined by a TPO. Continue?",
    )) return;

    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch(
        "/api/placements/jobs/" + encodeURIComponent(jobId) + "/offers/bulk-withdraw",
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offers,
            reason: reason.trim(),
            confirmed: true,
          }),
        },
      );
      if (!response.ok) throw new Error("Bulk offer withdrawal failed.");
      const body = (await response.json()) as { results: BulkOfferWithdrawalResult[] };
      setResults(body.results);
      setSelected([]);
      setReason("");
      router.refresh();
    } catch {
      setError(
        "Withdrawal could not be fully verified. Reload the drive to check offer states " +
        "before retrying; earlier selections may already have succeeded.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (choices.length === 0) return null;
  return (
    <section className="space-y-4 border-b border-border pb-5" aria-label="Bulk offer withdrawal">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Bulk withdraw offers
        </h3>
        <p className="mt-1 text-sm leading-6 text-body">
          Select up to 50 issued or accepted offers. Recorded joining outcomes
          cannot be withdrawn here. A TPO cannot accept or decline on behalf of a learner.
        </p>
      </div>
      {available.length === 0 ? (
        <p className="text-sm text-body">
          No currently eligible issued or pending-joining accepted offers are shown.
        </p>
      ) : (
        <>
          <div tabIndex={0} role="group" aria-label="Offers eligible for withdrawal, scroll for more" className="max-h-64 min-h-0 min-w-0 space-y-1 overflow-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border p-2 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
            {available.map((item) => (
              <label key={item.id} className="flex min-h-11 min-w-0 cursor-pointer flex-wrap items-center gap-2 px-2 py-1 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={(event) => change(item.id, event.target.checked)}
                  disabled={busy || (selected.length >= 50 && !selected.includes(item.id))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="min-w-0 flex-1 break-words font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground">{item.status}</span>
              </label>
            ))}
          </div>
          <label className="block text-sm font-semibold text-foreground">
            Withdrawal reason (required)
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={2}
              disabled={busy}
              className="mt-2 w-full"
            />
          </label>
          <div className="flex flex-col items-stretch gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <span className="font-medium text-body">{selected.length} / 50 offers selected</span>
            <Button variant="danger"
              type="button"
              onClick={() => void submit()}
              disabled={busy || selected.length === 0 || reason.trim().length < 8}
              loading={busy}
              className="min-h-11 w-full sm:w-auto md:min-h-9"
            >
              {busy ? "Applying withdrawal..." : "Review and confirm withdrawals"}
            </Button>
          </div>
        </>
      )}
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {results.length ? (
        <div aria-live="polite" className="space-y-2">
          <h4 className="font-semibold text-foreground">Per-offer results</h4>
          <ul className="divide-y divide-border rounded-[var(--lms-control-radius)] border border-border text-sm">
            {results.map((item) => (
              <li key={item.offerId} className="flex min-w-0 flex-wrap gap-2 break-words p-3">
                <span className="font-medium text-foreground">
                  {choices.find((choice) => choice.id === item.offerId)?.label ?? "Selected offer"}
                </span>
                <span className="text-body">{item.status.replaceAll("-", " ")}</span>
                {item.reason ? <span className="text-muted-foreground">{item.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
