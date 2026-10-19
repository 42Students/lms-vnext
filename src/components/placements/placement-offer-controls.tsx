"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { PlacementBulkOfferWithdraw } from "./placement-bulk-offer-withdraw";
import { TpoOfferLifecyclePanel } from "./tpo-offer-lifecycle-panel";

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
    kind?: "OFFER" | "LOI";
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
  kind: "OFFER" | "LOI";
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

const inputClass = "min-h-11 md:min-h-9 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-[var(--lms-focus-ring)]";

export function PlacementOfferControls({
  jobId,
  jobTitle,
  candidates,
  isTpo,
}: {
  jobId: string;
  jobTitle: string;
  candidates: readonly PlacementOfferCandidateItem[];
  isTpo: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [withdrawTarget,setWithdrawTarget]=useState<PlacementOfferCandidateItem|null>(null);
  const [withdrawReason,setWithdrawReason]=useState("Company withdrew the offer");
  const [withdrawDetail,setWithdrawDetail]=useState("");

  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        candidates.map((item) => [
          item.applicationId,
          {
            kind: item.offer?.kind ?? "OFFER",
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
          ? error.message
          : friendlyApiError({}),
    });
  }

  async function mutate(
    url: string,
    method: "POST" | "PUT",
    body: unknown,
  ) {
    return apiFetch<Record<string, unknown>>(url, {
      method,
      credentials: "same-origin",
      headers: {"content-type":"application/json"},
      body: JSON.stringify(body),
    });
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
          kind: draft.kind,
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
        title: draft.kind === "LOI" ? "Letter of intent issued" : "Offer issued",
        description:
          "The learner can now review and respond to the durable record.",
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
    const reason = (withdrawReason==="Other"?withdrawDetail:withdrawReason+(withdrawDetail.trim()?": "+withdrawDetail.trim():"")).trim();
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
      setWithdrawTarget(null);
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
    <section className="border-b border-border pb-6">
      <div className="border-b border-border pb-3">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Offers & joining
        </h2>
        <p className="mt-1 text-sm text-body">
          Issue offers only after every evaluative round has a confirmed pass. Learners accept or decline; the placement team records joining outcomes.
        </p>
      </div>

      {isTpo ? (
        <TpoOfferLifecyclePanel
          jobId={jobId}
          choices={candidates.flatMap((item) => item.offer ? [{
            id: item.offer.id,
            label: item.displayName ?? "Unnamed learner",
            status: item.offer.status,
            joiningStatus: item.joining?.status ?? null,
          }] : [])}
        />
      ) : null}

      {isTpo ? (
        <PlacementBulkOfferWithdraw
          jobId={jobId}
          choices={candidates.flatMap((item) => item.offer ? [{
            id: item.offer.id,
            label: item.displayName ?? "Unnamed learner",
            status: item.offer.status,
            joiningStatus: item.joining?.status ?? null,
          }] : [])}
        />
      ) : null}

      {candidates.length === 0 ? (
        <p className="m-0 py-6 text-sm text-muted-foreground">
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
                className="grid gap-4 py-5"
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
                  <div className="border-b border-border py-4 text-sm text-body">
                    <p className="m-0 font-semibold text-foreground">
                      {item.offer.kind === "LOI" ? "Letter of intent · " : ""}
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
                        Record type
                      </span>
                      <select
                        aria-label={"Record type for " + (item.displayName ?? "candidate")}
                        className={inputClass}
                        value={draft.kind}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [item.applicationId]: {
                              ...draft,
                              kind: event.target.value === "LOI" ? "LOI" : "OFFER",
                            },
                          }))
                        }
                      >
                        <option value="OFFER">Offer</option>
                        <option value="LOI">Letter of intent</option>
                      </select>
                    </label>
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
                          : draft.kind === "LOI" ? "Issue letter of intent" : "Issue offer"}
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
                      onClick={() => {setWithdrawTarget(item);setWithdrawReason("Company withdrew the offer");setWithdrawDetail("");}}
                    >
                      Withdraw offer
                    </Button>
                  </div>
                ) : null}

                {accepted && draft ? (
                  <div className="grid gap-3 border-b border-border py-4 lg:grid-cols-4">
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
      {withdrawTarget?.offer?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div role="dialog" aria-modal="true" aria-label="Withdraw offer confirmation"
          className="w-full max-w-lg space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
          <h3 className="font-semibold">Withdraw offer for {withdrawTarget.displayName??"learner"}?</h3>
          <p className="text-sm text-body">This notifies the learner and recalculates held-offer eligibility. History is retained.</p>
          <label className="grid gap-2 text-sm">Reason<select className={inputClass} value={withdrawReason}
            onChange={e=>setWithdrawReason(e.target.value)}>
            {["Company withdrew the offer","Hiring freeze","Duplicate offer issued","Offer details were incorrect","Other"].map(v=><option key={v}>{v}</option>)}
          </select></label>
          <label className="grid gap-2 text-sm">Additional details
           <textarea className={inputClass} maxLength={500} value={withdrawDetail} onChange={e=>setWithdrawDetail(e.target.value)}/>
          </label>
          <div className="flex gap-3">
            <Button variant="danger" disabled={pendingKey!==null||(withdrawReason==="Other"&&withdrawDetail.trim().length<3)}
              onClick={()=>void withdraw(withdrawTarget)}>Confirm withdrawal</Button>
            <Button variant="secondary" disabled={pendingKey!==null} onClick={()=>setWithdrawTarget(null)}>Keep offer</Button>
          </div>
        </div>
      </div>:null}
    </section>
  );
}
