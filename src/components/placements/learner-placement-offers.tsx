"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
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
  const [
    extensionOffer,
    setExtensionOffer,
  ] = useState<
    LearnerPlacementOfferItem | null
  >(null);
  const [
    requestedExpiry,
    setRequestedExpiry,
  ] = useState("");
  const [
    extensionReason,
    setExtensionReason,
  ] = useState("");

  async function respond(
    offerId: string,
    action: "ACCEPT" | "DECLINE",
  ) {
    let reason: string | null = null;
    if (action === "DECLINE") {
      reason =
        window.prompt(
          "Optional reason for declining this offer",
        )?.trim() || null;
    }

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

  async function requestExtension() {
    if (
      !extensionOffer ||
      !requestedExpiry ||
      !extensionReason.trim()
    ) {
      return;
    }

    setPendingId(
      extensionOffer.offerId,
    );
    try {
      const response = await fetch(
        "/api/placements/requests/me",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            applicationId:
              extensionOffer.applicationId,
            requestType:
              "OFFER_EXTENSION",
            offerId:
              extensionOffer.offerId,
            reason:
              extensionReason.trim(),
            requestedExpiresAt:
              new Date(
                requestedExpiry,
              ).toISOString(),
          }),
        },
      );
      const payload = await response
        .json()
        .catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_REQUEST_FAILED",
        );
      }

      setExtensionOffer(null);
      setRequestedExpiry("");
      setExtensionReason("");
      showToast({
        tone: "success",
        title: "Extension requested",
        description:
          "Your current offer remains unchanged until the placement team approves the request.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not request extension",
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
    <section className="space-y-3">
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
                  onClick={() =>
                    respond(
                      item.offerId,
                      "ACCEPT",
                    )
                  }
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
                  onClick={() =>
                    respond(
                      item.offerId,
                      "DECLINE",
                    )
                  }
                >
                  Decline offer
                </Button>
                {item.expiresAt ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      pendingId !== null
                    }
                    onClick={() => {
                      setExtensionOffer(
                        item,
                      );
                      setRequestedExpiry(
                        "",
                      );
                      setExtensionReason(
                        "",
                      );
                    }}
                  >
                    Request extension
                  </Button>
                ) : null}
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
        open={extensionOffer !== null}
        onOpenChange={(open) => {
          if (!open) {
            setExtensionOffer(null);
            setRequestedExpiry("");
            setExtensionReason("");
          }
        }}
        title="Request offer extension"
        description={
          extensionOffer
            ? `Ask the placement team to extend the response deadline for ${extensionOffer.roleTitle}.`
            : ""
        }
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pendingId !== null}
              onClick={() =>
                setExtensionOffer(null)
              }
            >
              Cancel
            </Button>
            <Button
              disabled={
                pendingId !== null ||
                !requestedExpiry ||
                !extensionReason.trim()
              }
              onClick={
                requestExtension
              }
            >
              {pendingId
                ? "Requesting…"
                : "Send request"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="offer-extension-expiry"
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Requested response deadline
            </label>
            <Input
              id="offer-extension-expiry"
              type="datetime-local"
              value={requestedExpiry}
              onChange={(event) =>
                setRequestedExpiry(
                  event.target.value,
                )
              }
            />
            {extensionOffer?.expiresAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Current deadline:{" "}
                {formatWhen(
                  extensionOffer.expiresAt,
                )}
              </p>
            ) : null}
          </div>
          <div>
            <label
              htmlFor="offer-extension-reason"
              className="mb-1.5 block text-xs font-semibold text-body"
            >
              Reason
            </label>
            <Textarea
              id="offer-extension-reason"
              value={extensionReason}
              onChange={(event) =>
                setExtensionReason(
                  event.target.value,
                )
              }
              maxLength={2000}
              placeholder="Explain why you need more time."
            />
          </div>
        </div>
      </Dialog>
    </section>
  );
}
