"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type LearnerPlacementOfferItem = {
  offerId: string;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  roleTitle: string;
  status:
    | "ISSUED"
    | "ACCEPTED"
    | "DECLINED"
    | "WITHDRAWN";
  annualCtcInr: number | null;
  joiningDate: string | null;
  expiresAt: string | null;
  issuedAt: string;
  joining: {
    status:
      | "PENDING"
      | "JOINED"
      | "DID_NOT_JOIN"
      | "DEFERRED";
    joiningDate: string | null;
    reason: string | null;
  } | null;
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatMoney(value: number | null) {
  if (value == null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatWhen(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function LearnerPlacementOffers({
  offers,
}: {
  offers: readonly LearnerPlacementOfferItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  const [confirmOffer, setConfirmOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [declineOffer, setDeclineOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const preview = confirmOffer
    ? learnerOfferAcceptancePreview({
        offerId: confirmOffer.offerId,
        companyName: confirmOffer.companyName,
        roleTitle: confirmOffer.roleTitle,
        jobTitle: confirmOffer.jobTitle,
        annualCtcInr: confirmOffer.annualCtcInr,
        joiningDate: confirmOffer.joiningDate,
        expiresAt: confirmOffer.expiresAt,
        status: confirmOffer.status,
      })
    : null;

  async function respond(
    offerId: string,
    action: "ACCEPT" | "DECLINE",
  ) {
    const reason = action === "DECLINE" ? declineReason.trim() || null : null;
    setPendingId(offerId);
    try {
      const response = await fetch(
        "/api/placements/offers/" +
          offerId +
          "/actions",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            ...(action === "DECLINE"
              ? { reason }
              : {}),
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_OFFER_ACTION_FAILED",
        );
      }

      showToast({
        tone: "success",
        title:
          action === "ACCEPT"
            ? "Offer accepted"
            : "Offer declined",
        description:
          action === "ACCEPT"
            ? "Your acceptance is recorded. Joining updates will appear here."
            : "Your response is recorded in the offer history.",
      });
      setConfirmOffer(null);
      setDeclineOffer(null);
      setDeclineReason("");
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not update offer",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section id="my-offers" className="scroll-mt-24 space-y-3">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">
          Offers
        </h2>
        <p className="mt-1 text-sm text-body">
          Review official offers separately from round results and track the joining outcome after acceptance.
        </p>
      </div>

      <div className="grid gap-4">
        {offers.map((item) => (
          <article
            key={item.offerId}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {item.companyName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {item.roleTitle}
                </h3>
                <p className="mt-1 text-sm text-body">
                  {item.jobTitle}
                  {formatMoney(
                    item.annualCtcInr,
                  )
                    ? " · " +
                      formatMoney(
                        item.annualCtcInr,
                      )
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    item.status ===
                    "ACCEPTED"
                      ? "success"
                      : item.status ===
                          "ISSUED"
                        ? "info"
                        : "neutral"
                  }
                >
                  {humanize(item.status)}
                </StatusBadge>
                {item.joining ? (
                  <StatusBadge
                    tone={
                      item.joining
                        .status === "JOINED"
                        ? "success"
                        : item.joining
                              .status ===
                            "DID_NOT_JOIN"
                          ? "error"
                          : "warning"
                    }
                  >
                    Joining{" "}
                    {humanize(
                      item.joining.status,
                    )}
                  </StatusBadge>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-body sm:grid-cols-3">
              <p className="m-0">
                <span className="font-semibold text-foreground">
                  Issued:
                </span>{" "}
                {formatWhen(item.issuedAt)}
              </p>
              <p className="m-0">
                <span className="font-semibold text-foreground">
                  Planned joining:
                </span>{" "}
                {item.joiningDate ??
                  "Not specified"}
              </p>
              <p className="m-0">
                <span className="font-semibold text-foreground">
                  Respond by:
                </span>{" "}
                {formatWhen(
                  item.expiresAt,
                ) ?? "No expiry"}
              </p>
            </div>

            {item.status === "ISSUED" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={
                    pendingId !== null
                  }
                  onClick={() => setConfirmOffer(item)}
                >
                  {pendingId ===
                  item.offerId
                    ? "Saving…"
                    : "Accept offer"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={
                    pendingId !== null
                  }
                  onClick={() => { setDeclineReason(""); setDeclineOffer(item); }}
                >
                  Decline offer
                </Button>
              </div>
            ) : null}

            {item.joining &&
            item.joining.status !==
              "PENDING" ? (
              <div className="mt-4 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-body">
                <p className="m-0 font-semibold text-foreground">
                  Joining outcome
                </p>
                <p className="mt-1">
                  {humanize(
                    item.joining.status,
                  )}
                  {item.joining
                    .joiningDate
                    ? " · " +
                      item.joining
                        .joiningDate
                    : ""}
                </p>
                {item.joining.reason ? (
                  <p className="mt-1 text-xs">
                    {item.joining.reason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <Dialog
        open={declineOffer !== null}
        onOpenChange={(open) => { if (!open && pendingId === null) setDeclineOffer(null); }}
        title="Confirm offer decline"
        description="Declining is recorded as an official response and cannot be undone from the Learner workspace."
        footer={<>
          <Button variant="secondary" disabled={pendingId !== null} onClick={() => setDeclineOffer(null)}>
            Keep offer pending
          </Button>
          <Button disabled={pendingId !== null || declineReason.length > 2000}
            onClick={() => { if (declineOffer) void respond(declineOffer.offerId, "DECLINE"); }}>
            {pendingId !== null ? "Saving…" : "Confirm decline"}
          </Button>
        </>}
      >
        {declineOffer ? <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {declineOffer.companyName} · {declineOffer.roleTitle}
          </p>
          <p className="text-sm text-body">
            Recorded CTC: {formatMoney(declineOffer.annualCtcInr) ?? "Not specified"}.
            The server rechecks the status and deadline on confirmation.
          </p>
          <label className="block text-xs font-semibold text-body" htmlFor="offer-decline-reason">
            Reason (optional, up to 2000 characters)
          </label>
          <textarea id="offer-decline-reason" rows={3} maxLength={2000} value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            className="min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground" />
        </div> : null}
      </Dialog>
      <Dialog
        open={confirmOffer !== null}
        onOpenChange={(open) => { if (!open && pendingId === null) setConfirmOffer(null); }}
        title="Review offer before accepting"
        description="Review the recorded offer terms. Acceptance is only submitted after you confirm."
        footer={
          <>
            <Button variant="secondary" disabled={pendingId !== null}
              onClick={() => setConfirmOffer(null)}>Keep offer pending</Button>
            <Button disabled={!preview?.canConfirm || pendingId !== null}
              onClick={() => { if (preview?.canConfirm) void respond(preview.offerId, "ACCEPT"); }}>
              {pendingId !== null ? "Saving…" : "Confirm acceptance"}
            </Button>
          </>
        }
      >
        {preview ? (
          <div className="space-y-3 text-sm text-body">
            <p className="font-semibold text-foreground">{preview.companyName} · {preview.roleTitle}</p>
            <p>Drive: {preview.jobTitle}</p>
            <p>Annual CTC: {formatMoney(preview.annualCtcInr) ?? "Not specified"}</p>
            <p>Planned joining: {preview.joiningDate ?? "Not specified"}</p>
            <p>Response deadline: {formatWhen(preview.expiresAt) ?? "No expiry specified"}</p>
            {preview.expired ? (
              <p role="alert" className="font-semibold text-error">This offer has expired. Acceptance is disabled.</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Confirming records your acceptance; it does not prove that you joined.
              The server checks offer status, eligibility and deadlines again.
            </p>
          </div>
        ) : null}
      </Dialog>
    </section>
  );
}
