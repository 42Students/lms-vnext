"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

/** Legacy seven-option vocabulary. Keep specialized vNext request payload
 * shapes separate: Withdrawal needs an application, Extension an offer; the
 * remaining five are the authorized general-request kinds. Round reschedule
 * remains an additional vNext-only action.
 */
export const LEGACY_LEARNER_REQUEST_KIND_CHOICES = [
 {legacy:"WITHDRAWAL",label:"Withdrawal",vNext:"APPLICATION_WITHDRAWAL",surface:"APPLICATION"},
 {legacy:"OFFER_EXTENSION",label:"Offer extension",vNext:"OFFER_EXTENSION",surface:"OFFER"},
 {legacy:"REGISTRATION_CHANGE",label:"Registration change",vNext:"REGISTRATION_CHANGE",surface:"GENERAL"},
 {legacy:"ABSENCE_DISPUTE",label:"Absence dispute",vNext:"ABSENCE_DISPUTE",surface:"GENERAL"},
 {legacy:"CORRECTION",label:"Correction",vNext:"CORRECTION_WITH_PROOF",surface:"GENERAL"},
 {legacy:"EXTERNAL_OFFER",label:"External offer",vNext:"OFF_CAMPUS_OFFER",surface:"GENERAL"},
 {legacy:"PAP",label:"Placement after placement",vNext:"PLACEMENT_AFTER_PLACEMENT",surface:"GENERAL"},
] as const;

type RequestItem = {
  id: string;
  requestType:
    | "APPLICATION_WITHDRAWAL"
    | "ROUND_RESCHEDULE"
    | "OFFER_EXTENSION";
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  reason: string;
  decisionNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
  roleTitle: string;
  jobTitle: string;
  companyName: string;
  roundName: string | null;
  offerRoleTitle: string | null;
  effectPayload: Record<string, unknown>;
};

type RoundOption = {
  applicationId: string;
  roundId: string;
  roundName: string;
  sequence: number;
  roleTitle: string;
  companyName: string;
  scheduledAt: string | null;
  timezone: string | null;
  mode: string | null;
  venue: string | null;
  meetingUrl: string | null;
  exception: {
    scheduledAt: string;
    timezone: string;
    mode: string;
    venue: string | null;
    meetingUrl: string | null;
  } | null;
};

type OfferOption = {
  applicationId: string;
  offerId: string;
  roleTitle: string;
  companyName: string;
  expiresAt: string | null;
};

function legacyRequestStatus(value:RequestItem["status"]):string{
 return value==="PENDING"?"Waiting for the placement cell":
  value==="REJECTED"?"Not approved":value==="APPROVED"?"Approved":"Cancelled";
}
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

function when(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function localInput(value: string | null) {
  const source = value ? new Date(value) : new Date();
  source.setHours(source.getHours() + 24);
  const local = new Date(
    source.getTime() -
      source.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
}

async function mutate(url: string, body: unknown): Promise<void> {
  // Learner placement requests must not expose raw API error codes or proxy HTML.
  await apiFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function LearnerPlacementRequests({
  requests,
  rounds,
  offers,
  initialRoundId = null,
}: {
  requests: readonly RequestItem[];
  rounds: readonly RoundOption[];
  offers: readonly OfferOption[];
  initialRoundId?: string | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] =
    useState<string | null>(null);
  // Only preselect a round that exists in this Learner's authorized workspace.
  const firstRound =
    rounds.find((round) => round.roundId === initialRoundId) ??
    rounds[0] ??
    null;
  const [roundId, setRoundId] = useState(
    firstRound?.roundId ?? "",
  );
  const selectedRound = useMemo(
    () =>
      rounds.find(
        (item) => item.roundId === roundId,
      ) ?? null,
    [roundId, rounds],
  );
  const [roundAt, setRoundAt] = useState(
    localInput(
      firstRound?.exception?.scheduledAt ??
        firstRound?.scheduledAt ??
        null,
    ),
  );
  const [roundMode, setRoundMode] = useState<
    "ON_CAMPUS" | "VIRTUAL"
  >(
    firstRound?.mode === "VIRTUAL"
      ? "VIRTUAL"
      : "ON_CAMPUS",
  );
  const [roundPlace, setRoundPlace] =
    useState("");
  const [roundReason, setRoundReason] =
    useState("");
  const firstOfferWithDeadline =
    offers.find(
      (offer) => offer.expiresAt,
    ) ?? null;
  const [offerId, setOfferId] = useState(
    firstOfferWithDeadline?.offerId ?? "",
  );
  const selectedOffer = useMemo(
    () =>
      offers.find(
        (item) => item.offerId === offerId,
      ) ?? null,
    [offerId, offers],
  );
  const [offerAt, setOfferAt] = useState(
    localInput(
      firstOfferWithDeadline?.expiresAt ??
        null,
    ),
  );
  const [offerReason, setOfferReason] =
    useState("");

  // Warn before discarding an unsent learner request. Saved requests have
  // their own history and are not affected by leaving this screen.
  useEffect(()=>{
    if(!roundReason.trim()&&!offerReason.trim())return;
    const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    const links=(event:MouseEvent)=>{
      const link=event.target instanceof Element?event.target.closest("a[href]"):null;
      if(!link||event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      const href=link.getAttribute("href");
      if(!href||href.startsWith("#"))return;
      try{
        const url=new URL(href,window.location.href);
        if(url.origin===window.location.origin&&
           (url.pathname!==window.location.pathname||url.search!==window.location.search)&&
           !window.confirm("Discard this unsent placement request?"))event.preventDefault();
      }catch{/* The browser handles malformed links. */}
    };
    window.addEventListener("beforeunload",guard);
    document.addEventListener("click",links,true);
    return ()=>{window.removeEventListener("beforeunload",guard);document.removeEventListener("click",links,true);};
  },[roundReason,offerReason]);

  function requestRelativeTime(value:string){
    const time=new Date(value).getTime();
    if(!Number.isFinite(time))return "at an unavailable time";
    const elapsed=Math.max(0,Date.now()-time);
    const hours=Math.floor(elapsed/3_600_000);
    if(hours<1)return "just now";
    if(hours<24)return hours+" hour"+(hours===1?"":"s")+" ago";
    const days=Math.floor(hours/24);
    return days+" day"+(days===1?"":"s")+" ago";
  }

  function success(
    title: string,
    description: string,
  ) {
    showToast({
      tone: "success",
      title,
      description,
    });
    router.refresh();
  }

  function failure(error: unknown) {
    showToast({
      tone: "error",
      title: "Request not submitted",
      description: error instanceof Error
          ? error.message
          : friendlyApiError({ network: true }),
    });
  }

  async function submitRound() {
    if (
      !selectedRound ||
      roundReason.trim().length < 3 ||
      !roundAt ||
      !roundPlace.trim()
    ) {
      failure(
        new Error(
          "Complete the requested time, delivery details and reason",
        ),
      );
      return;
    }
    setPendingKey("round");
    try {
      await mutate("/api/placements/requests", {
        requestType: "ROUND_RESCHEDULE",
        applicationId:
          selectedRound.applicationId,
        roundId: selectedRound.roundId,
        reason: roundReason.trim(),
        scheduledAt: new Date(
          roundAt,
        ).toISOString(),
        timezone: "Asia/Kolkata",
        mode: roundMode,
        ...(roundMode === "ON_CAMPUS"
          ? { venue: roundPlace.trim() }
          : {
              meetingUrl:
                roundPlace.trim(),
            }),
      });
      setRoundReason("");
      success(
        "Sent to the placement cell",
        "The original shared round remains unchanged until the placement team approves your candidate-specific exception.",
      );
    } catch (error) {
      failure(error);
    } finally {
      setPendingKey(null);
    }
  }

  async function submitOffer() {
    if (
      !selectedOffer ||
      offerReason.trim().length < 3 ||
      !offerAt
    ) {
      failure(
        new Error(
          "Choose the offer, requested deadline and reason",
        ),
      );
      return;
    }
    setPendingKey("offer");
    try {
      await mutate("/api/placements/requests", {
        requestType: "OFFER_EXTENSION",
        applicationId:
          selectedOffer.applicationId,
        offerId: selectedOffer.offerId,
        reason: offerReason.trim(),
        requestedExpiresAt: new Date(
          offerAt,
        ).toISOString(),
      });
      setOfferReason("");
      success(
        "Sent to the placement cell",
        "The offer deadline changes only if the placement team approves the request.",
      );
    } catch (error) {
      failure(error);
    } finally {
      setPendingKey(null);
    }
  }

  async function cancel(requestId: string) {
    setPendingKey(requestId);
    try {
      await mutate(
        "/api/placements/requests/" +
          requestId +
          "/actions",
        { action: "CANCEL" },
      );
      success(
        "Request cancelled",
        "No placement state was changed.",
      );
    } catch (error) {
      failure(error);
    } finally {
      setPendingKey(null);
    }
  }

  const pending = requests.filter(
    (item) => item.status === "PENDING",
  );

  return (
    <section className="border-b border-border pb-5">
      <div className="border-b border-border py-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
              New request
            </h2>
            <p className="mt-1 text-sm text-body leading-[22px]">
              Ask for schedule or offer exceptions without silently changing shared placement data. Approved requests apply their effect atomically.
            </p>
          </div>
          <StatusBadge
            tone={
              pending.length > 0
                ? "warning"
                : "neutral"
            }
          >
            {pending.length} pending
          </StatusBadge>
        </div>
      </div>

      <div role="group" aria-label="What do you need?" className="min-w-0 divide-y divide-border py-2">
        <details id="round-reschedule" open={Boolean(initialRoundId) || undefined} className="group min-w-0 scroll-mt-24 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-foreground hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            Round reschedule <span aria-hidden="true" className="text-link">⌄</span>
          </summary>
          <div className="min-w-0 max-w-3xl px-2 pb-4">
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Creates a candidate-specific schedule exception; it never moves the shared round for everyone.
          </p>
          {rounds.length === 0 ? (
            <p className="mt-4 text-sm text-body leading-[22px]">
              No scheduled shortlisted rounds are available for a reschedule request.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <Select className="min-h-11 md:min-h-9"
                aria-label="Round to reschedule"
                value={roundId}
                onChange={(event) => {
                  const next =
                    rounds.find(
                      (item) =>
                        item.roundId ===
                        event.target.value,
                    ) ?? null;
                  setRoundId(
                    event.target.value,
                  );
                  setRoundAt(
                    localInput(
                      next?.exception
                        ?.scheduledAt ??
                        next?.scheduledAt ??
                        null,
                    ),
                  );
                  setRoundMode(
                    next?.mode === "VIRTUAL"
                      ? "VIRTUAL"
                      : "ON_CAMPUS",
                  );
                  setRoundPlace(
                    next?.mode === "VIRTUAL"
                      ? next.meetingUrl ?? ""
                      : next?.venue ?? "",
                  );
                }}
              >
                {rounds.map((round) => (
                  <option
                    key={round.roundId}
                    value={round.roundId}
                  >
                    {round.companyName} ·{" "}
                    {round.roleTitle} · Round{" "}
                    {round.sequence}{" "}
                    {round.roundName}
                  </option>
                ))}
              </Select>
              {selectedRound ? (
                <p className="m-0 text-xs text-muted-foreground leading-5">
                  Current effective time:{" "}
                  {when(
                    selectedRound.exception
                      ?.scheduledAt ??
                      selectedRound.scheduledAt,
                  )}
                  {selectedRound.exception
                    ? " · approved exception"
                    : ""}
                </p>
              ) : null}
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <Input className="min-h-11 md:min-h-9"
                  aria-label="Requested round time"
                  type="datetime-local"
                  value={roundAt}
                  onChange={(event) =>
                    setRoundAt(
                      event.target.value,
                    )
                  }
                />
                <Select className="min-h-11 md:min-h-9"
                  aria-label="Requested round mode"
                  value={roundMode}
                  onChange={(event) =>
                    setRoundMode(
                      event.target
                        .value as
                        | "ON_CAMPUS"
                        | "VIRTUAL",
                    )
                  }
                >
                  <option value="ON_CAMPUS">
                    On campus
                  </option>
                  <option value="VIRTUAL">
                    Virtual
                  </option>
                </Select>
              </div>
              <Input className="min-h-11 md:min-h-9"
                aria-label={
                  roundMode === "ON_CAMPUS"
                    ? "Requested venue"
                    : "Requested meeting URL"
                }
                placeholder={
                  roundMode === "ON_CAMPUS"
                    ? "Requested venue"
                    : "https://meet.example/..."
                }
                value={roundPlace}
                onChange={(event) =>
                  setRoundPlace(
                    event.target.value,
                  )
                }
              />
              <Textarea
                aria-label="Reschedule reason"
                className="min-h-28"
                placeholder="Tell the placement cell why"
                value={roundReason}
                onChange={(event) =>
                  setRoundReason(
                    event.target.value,
                  )
                }
              />
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                size="sm"
                disabled={pendingKey !== null}
                onClick={submitRound}
              >
                {pendingKey === "round"
                  ? "Requesting…"
                  : "Request reschedule"}
              </Button>
            </div>
          )}
          </div>
        </details>

        <details className="group min-w-0 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-semibold text-foreground hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            Offer deadline extension <span aria-hidden="true" className="text-link">⌄</span>
          </summary>
          <div className="min-w-0 max-w-3xl px-2 pb-4">
          <p className="mt-1 text-xs text-muted-foreground leading-5">
            Only issued offers with an existing response deadline can be extended.
          </p>
          {offers.filter(
            (offer) => offer.expiresAt,
          ).length === 0 ? (
            <p className="mt-4 text-sm text-body leading-[22px]">
              No issued offer with a deadline is available for an extension request.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <Select className="min-h-11 md:min-h-9"
                aria-label="Offer to extend"
                value={offerId}
                onChange={(event) => {
                  const next =
                    offers.find(
                      (item) =>
                        item.offerId ===
                        event.target.value,
                    ) ?? null;
                  setOfferId(
                    event.target.value,
                  );
                  setOfferAt(
                    localInput(
                      next?.expiresAt ??
                        null,
                    ),
                  );
                }}
              >
                {offers
                  .filter(
                    (offer) =>
                      offer.expiresAt,
                  )
                  .map((offer) => (
                    <option
                      key={offer.offerId}
                      value={offer.offerId}
                    >
                      {offer.companyName} ·{" "}
                      {offer.roleTitle}
                    </option>
                  ))}
              </Select>
              {selectedOffer ? (
                <p className="m-0 text-xs text-muted-foreground leading-5">
                  Current deadline:{" "}
                  {when(
                    selectedOffer.expiresAt,
                  )}
                </p>
              ) : null}
              <Input className="min-h-11 md:min-h-9"
                aria-label="Requested offer deadline"
                type="datetime-local"
                value={offerAt}
                onChange={(event) =>
                  setOfferAt(
                    event.target.value,
                  )
                }
              />
              <Textarea
                aria-label="Offer extension reason"
                className="min-h-28"
                placeholder="Tell the placement cell why"
                value={offerReason}
                onChange={(event) =>
                  setOfferReason(
                    event.target.value,
                  )
                }
              />
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                size="sm"
                disabled={pendingKey !== null}
                onClick={submitOffer}
              >
                {pendingKey === "offer"
                  ? "Requesting…"
                  : "Request extension"}
              </Button>
            </div>
          )}
          </div>
        </details>
      </div>

      {requests.length > 0 ? (
        <div className="border-t border-border py-5">
          <h3 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
            Request history
          </h3>
          <div className="mt-3 divide-y divide-border border-y border-border">
            {requests.map((item) => (
              <article
                key={item.id}
                className="min-w-0 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 font-semibold text-foreground">
                      {humanize(
                        item.requestType,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-body leading-[22px]">
                      {item.companyName} ·{" "}
                      {item.roleTitle}
                      {item.roundName
                        ? " · " +
                          item.roundName
                        : ""}
                    </p>
                    <p className="mt-2 text-sm text-body leading-[22px]">
                      {item.reason}
                    </p>
                    {item.decisionNote ? (
                      <p className="mt-2 text-xs text-muted-foreground leading-5">
                        Reply:{" "}
                        {item.decisionNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      tone={
                        item.status ===
                        "APPROVED"
                          ? "success"
                          : item.status ===
                              "REJECTED"
                            ? "error"
                            : item.status ===
                                "PENDING"
                              ? "warning"
                              : "neutral"
                      }
                    >
                      {legacyRequestStatus(item.status)}
                    </StatusBadge>
                    {item.status ===
                    "PENDING" ? (
                      <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                        size="sm"
                        variant="secondary"
                        disabled={
                          pendingKey !== null
                        }
                        onClick={() =>
                          cancel(item.id)
                        }
                      >
                        {pendingKey ===
                        item.id
                          ? "Cancelling…"
                          : "Cancel"}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-5">
                  Sent{" "}
                  {requestRelativeTime(item.requestedAt)}
                  {item.decidedAt
                    ? " · decided " +
                      when(
                        item.decidedAt,
                      )
                    : ""}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
