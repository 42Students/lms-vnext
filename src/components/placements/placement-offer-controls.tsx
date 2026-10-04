"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type OfferStatus =
  | "ISSUED"
  | "ACCEPTED"
  | "DECLINED"
  | "WITHDRAWN";

type JoiningStatus =
  | "PENDING"
  | "JOINED"
  | "DID_NOT_JOIN"
  | "DEFERRED";

export type PlacementOfferCandidateItem = {
  applicationId: string;
  displayName: string | null;
  email: string | null;
  roleTitle: string;
  offerReady: boolean;
  offer: {
    id: string;
    status: OfferStatus;
    roleTitle: string;
    annualCtcInr: number | null;
    joiningDate: string | null;
    expiresAt: string | null;
    issuedAt: string;
  } | null;
  joining: {
    status: JoiningStatus;
    joiningDate: string | null;
    reason: string | null;
  } | null;
};

type Draft = {
  roleTitle: string;
  annualCtcInr: string;
  joiningDate: string;
  expiresAt: string;
  joiningStatus:
    | "JOINED"
    | "DID_NOT_JOIN"
    | "DEFERRED";
  joiningOutcomeDate: string;
  joiningReason: string;
  correctionReason: string;
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

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

export function PlacementOfferControls({
  jobTitle,
  candidates,
}: {
  jobTitle: string;
  candidates: readonly PlacementOfferCandidateItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] =
    useState<string | null>(null);

  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        candidates.map((item) => [
          item.applicationId,
          {
            roleTitle:
              item.offer?.roleTitle ??
              item.roleTitle ??
              jobTitle,
            annualCtcInr:
              item.offer?.annualCtcInr?.toString() ??
              "",
            joiningDate:
              item.offer?.joiningDate ?? "",
            expiresAt: "",
            joiningStatus:
              item.joining?.status ===
              "DEFERRED"
                ? "DEFERRED"
                : item.joining?.status ===
                    "DID_NOT_JOIN"
                  ? "DID_NOT_JOIN"
                  : "JOINED",
            joiningOutcomeDate:
              item.joining?.joiningDate ??
              item.offer?.joiningDate ??
              "",
            joiningReason:
              item.joining?.reason ?? "",
            correctionReason: "",
          } satisfies Draft,
        ]),
      ) as Record<string, Draft>,
    [candidates, jobTitle],
  );
  const [drafts, setDrafts] =
    useState(initialDrafts);

  function toastError(
    title: string,
    error: unknown,
  ) {
    showToast({
      tone: "error",
      title,
      description:
        error instanceof Error
          ? humanize(error.message)
          : "Please try again.",
    });
  }

  async function mutate(
    url: string,
    method: "POST" | "PUT",
    body: unknown,
  ) {
    const response = await fetch(url, {
      method,
      headers: {
        "content-type":
          "application/json",
      },
      body: JSON.stringify(body),
    });
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
    return payload;
  }

  async function issue(
    item: PlacementOfferCandidateItem,
  ) {
    const draft =
      drafts[item.applicationId];
    if (!draft?.roleTitle.trim()) {
      toastError(
        "Role title required",
        new Error(
          "Enter the role title for this offer",
        ),
      );
      return;
    }

    const key =
      "issue:" + item.applicationId;
    setPendingKey(key);
    try {
      await mutate(
        "/api/placements/applications/" +
          item.applicationId +
          "/offers",
        "POST",
        {
          roleTitle:
            draft.roleTitle.trim(),
          annualCtcInr:
            draft.annualCtcInr
              ? Number(
                  draft.annualCtcInr,
                )
              : null,
          joiningDate:
            draft.joiningDate || null,
          expiresAt:
            draft.expiresAt
              ? new Date(
                  draft.expiresAt,
                ).toISOString()
              : null,
        },
      );
      showToast({
        tone: "success",
        title: "Offer issued",
        description:
          "The learner can now review and respond to the durable offer.",
      });
      router.refresh();
    } catch (error) {
      toastError(
        "Could not issue offer",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function withdraw(
    item: PlacementOfferCandidateItem,
  ) {
    if (!item.offer) return;
    const reason =
      window.prompt(
        "Reason for withdrawing this offer",
      )?.trim();
    if (!reason) return;

    const key =
      "withdraw:" + item.offer.id;
    setPendingKey(key);
    try {
      await mutate(
        "/api/placements/offers/" +
          item.offer.id +
          "/actions",
        "POST",
        {
          action: "WITHDRAW",
          reason,
        },
      );
      showToast({
        tone: "success",
        title: "Offer withdrawn",
        description:
          "The withdrawal is retained in offer history.",
      });
      router.refresh();
    } catch (error) {
      toastError(
        "Could not withdraw offer",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function recordJoining(
    item: PlacementOfferCandidateItem,
  ) {
    if (!item.offer) return;
    const draft =
      drafts[item.applicationId];
    if (!draft) return;

    const key =
      "joining:" + item.offer.id;
    setPendingKey(key);
    try {
      await mutate(
        "/api/placements/offers/" +
          item.offer.id +
          "/joining",
        "PUT",
        {
          status:
            draft.joiningStatus,
          joiningDate:
            draft.joiningOutcomeDate ||
            null,
          reason:
            draft.joiningReason.trim() ||
            null,
          correctionReason:
            draft.correctionReason.trim() ||
            null,
        },
      );
      showToast({
        tone: "success",
        title: "Joining outcome recorded",
        description:
          "The outcome and any later correction remain auditable.",
      });
      router.refresh();
    } catch (error) {
      toastError(
        "Could not record joining outcome",
        error,
      );
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Offers & joining
        </h2>
        <p className="mt-1 text-sm text-body">
          Issue offers only after every evaluative round has a confirmed pass. Learners accept or decline; the placement team records joining outcomes.
        </p>
      </div>

      {candidates.length === 0 ? (
        <p className="m-0 px-5 py-6 text-sm text-muted-foreground">
          No shortlisted candidates are available for offer review.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {candidates.map((item) => {
            const draft =
              drafts[item.applicationId];
            const active =
              item.offer?.status ===
                "ISSUED" ||
              item.offer?.status ===
                "ACCEPTED";
            const accepted =
              item.offer?.status ===
              "ACCEPTED";

            return (
              <div
                key={item.applicationId}
                className="grid gap-4 px-5 py-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="m-0 font-semibold text-foreground">
                      {item.displayName ??
                        "Candidate"}
                    </p>
                    <p className="mt-1 text-sm text-body">
                      {item.roleTitle} ·{" "}
                      {item.email ??
                        "No email on profile"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      tone={
                        item.offerReady
                          ? "success"
                          : "warning"
                      }
                    >
                      {item.offerReady
                        ? "Offer ready"
                        : "Rounds incomplete"}
                    </StatusBadge>
                    {item.offer ? (
                      <StatusBadge
                        tone={
                          accepted
                            ? "success"
                            : item.offer
                                  .status ===
                                "ISSUED"
                              ? "info"
                              : "neutral"
                        }
                      >
                        {humanize(
                          item.offer.status,
                        )}
                      </StatusBadge>
                    ) : null}
                    {item.joining ? (
                      <StatusBadge>
                        Joining{" "}
                        {humanize(
                          item.joining
                            .status,
                        )}
                      </StatusBadge>
                    ) : null}
                  </div>
                </div>

                {item.offer ? (
                  <div className="rounded-lg border border-border bg-muted p-4 text-sm text-body">
                    <p className="m-0 font-semibold text-foreground">
                      {item.offer.roleTitle}
                    </p>
                    <p className="mt-1">
                      {formatMoney(
                        item.offer
                          .annualCtcInr,
                      ) ??
                        "CTC not specified"}
                      {item.offer
                        .joiningDate
                        ? " · planned joining " +
                          item.offer
                            .joiningDate
                        : ""}
                    </p>
                  </div>
                ) : null}

                {!active &&
                item.offerReady &&
                draft ? (
                  <div className="grid gap-3 lg:grid-cols-4">
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Role title
                      </span>
                      <input
                        aria-label={
                          "Offer role title for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        value={
                          draft.roleTitle
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  roleTitle:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Annual CTC (INR)
                      </span>
                      <input
                        aria-label={
                          "Offer annual CTC for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        type="number"
                        min="0"
                        value={
                          draft.annualCtcInr
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  annualCtcInr:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Planned joining
                      </span>
                      <input
                        aria-label={
                          "Offer joining date for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        type="date"
                        value={
                          draft.joiningDate
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  joiningDate:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Offer expires
                      </span>
                      <input
                        aria-label={
                          "Offer expiry for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        type="datetime-local"
                        value={
                          draft.expiresAt
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  expiresAt:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                      />
                    </label>
                    <div className="lg:col-span-4">
                      <Button
                        size="sm"
                        disabled={
                          pendingKey !==
                          null
                        }
                        onClick={() =>
                          issue(item)
                        }
                      >
                        {pendingKey ===
                        "issue:" +
                          item.applicationId
                          ? "Issuing…"
                          : "Issue offer"}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {item.offer?.status ===
                "ISSUED" ? (
                  <div>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={
                        pendingKey !== null
                      }
                      onClick={() =>
                        withdraw(item)
                      }
                    >
                      Withdraw offer
                    </Button>
                  </div>
                ) : null}

                {accepted && draft ? (
                  <div className="grid gap-3 rounded-lg border border-border p-4 lg:grid-cols-4">
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Joining outcome
                      </span>
                      <select
                        aria-label={
                          "Joining outcome for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        value={
                          draft.joiningStatus
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  joiningStatus:
                                    event
                                      .target
                                      .value as Draft["joiningStatus"],
                                },
                            }),
                          )
                        }
                      >
                        <option value="JOINED">
                          Joined
                        </option>
                        <option value="DEFERRED">
                          Deferred
                        </option>
                        <option value="DID_NOT_JOIN">
                          Did not join
                        </option>
                      </select>
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Actual/new date
                      </span>
                      <input
                        aria-label={
                          "Joining outcome date for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        type="date"
                        value={
                          draft.joiningOutcomeDate
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  joiningOutcomeDate:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Outcome reason
                      </span>
                      <input
                        aria-label={
                          "Joining reason for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        value={
                          draft.joiningReason
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  joiningReason:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                        placeholder="Required for deferred / did not join"
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-body">
                        Correction reason
                      </span>
                      <input
                        aria-label={
                          "Joining correction reason for " +
                          (item.displayName ??
                            "candidate")
                        }
                        className={
                          inputClass
                        }
                        value={
                          draft.correctionReason
                        }
                        onChange={(event) =>
                          setDrafts(
                            (current) => ({
                              ...current,
                              [item.applicationId]:
                                {
                                  ...draft,
                                  correctionReason:
                                    event
                                      .target
                                      .value,
                                },
                            }),
                          )
                        }
                        placeholder="Required when correcting a recorded outcome"
                      />
                    </label>
                    <div className="lg:col-span-4">
                      <Button
                        size="sm"
                        disabled={
                          pendingKey !==
                          null
                        }
                        onClick={() =>
                          recordJoining(
                            item,
                          )
                        }
                      >
                        {pendingKey ===
                        "joining:" +
                          item.offer?.id
                          ? "Recording…"
                          : "Record joining outcome"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
