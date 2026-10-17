"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

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

const textareaClass =
  "min-h-24 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-[var(--lms-placeholder)] focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

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
    <section className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              New request
            </h2>
            <p className="mt-1 text-sm text-body">
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

      <div className="grid gap-5 p-5 xl:grid-cols-2">
        <div id="round-reschedule" className="scroll-mt-24 rounded-lg border border-border bg-muted p-4">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Round reschedule
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Creates a candidate-specific schedule exception; it never moves the shared round for everyone.
          </p>
          {rounds.length === 0 ? (
            <p className="mt-4 text-sm text-body">
              No scheduled shortlisted rounds are available for a reschedule request.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <Select
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
                <p className="m-0 text-xs text-muted-foreground">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  aria-label="Requested round time"
                  type="datetime-local"
                  value={roundAt}
                  onChange={(event) =>
                    setRoundAt(
                      event.target.value,
                    )
                  }
                />
                <Select
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
              <Input
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
              <textarea
                aria-label="Reschedule reason"
                className={textareaClass}
                placeholder="Tell the placement cell why"
                value={roundReason}
                onChange={(event) =>
                  setRoundReason(
                    event.target.value,
                  )
                }
              />
              <Button
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

        <div className="rounded-lg border border-border bg-muted p-4">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Offer deadline extension
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only issued offers with an existing response deadline can be extended.
          </p>
          {offers.filter(
            (offer) => offer.expiresAt,
          ).length === 0 ? (
            <p className="mt-4 text-sm text-body">
              No issued offer with a deadline is available for an extension request.
            </p>
          ) : (
            <div className="mt-4 grid gap-3">
              <Select
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
                <p className="m-0 text-xs text-muted-foreground">
                  Current deadline:{" "}
                  {when(
                    selectedOffer.expiresAt,
                  )}
                </p>
              ) : null}
              <Input
                aria-label="Requested offer deadline"
                type="datetime-local"
                value={offerAt}
                onChange={(event) =>
                  setOfferAt(
                    event.target.value,
                  )
                }
              />
              <textarea
                aria-label="Offer extension reason"
                className={textareaClass}
                placeholder="Tell the placement cell why"
                value={offerReason}
                onChange={(event) =>
                  setOfferReason(
                    event.target.value,
                  )
                }
              />
              <Button
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
      </div>

      {requests.length > 0 ? (
        <div className="border-t border-border p-5">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Request history
          </h3>
          <div className="mt-3 grid gap-3">
            {requests.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-border bg-muted p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="m-0 font-semibold text-foreground">
                      {humanize(
                        item.requestType,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-body">
                      {item.companyName} ·{" "}
                      {item.roleTitle}
                      {item.roundName
                        ? " · " +
                          item.roundName
                        : ""}
                    </p>
                    <p className="mt-2 text-sm text-body">
                      {item.reason}
                    </p>
                    {item.decisionNote ? (
                      <p className="mt-2 text-xs text-muted-foreground">
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
                      <Button
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
                <p className="mt-2 text-xs text-muted-foreground">
                  Sent{" "}
                  {when(item.requestedAt)}
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
