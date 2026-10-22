"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export type PlacementRequestQueueItem = {
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
  candidateName: string | null;
  candidateEmail: string | null;
  roleTitle: string;
  roundName: string | null;
  roundScheduledAt: string | null;
  offerRoleTitle: string | null;
  offerExpiresAt: string | null;
  effectPayload: Record<string, unknown>;
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

function when(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function PlacementRequestQueue({
  requests,
}: {
  requests: readonly PlacementRequestQueueItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmation,setConfirmation]=useState<{item:PlacementRequestQueueItem;action:"APPROVE"|"REJECT"}|null>(null);
  const [validationError,setValidationError]=useState<Record<string,string>>({});
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  const decisionRef=useRef(false);
  const [notes, setNotes] = useState<
    Record<string, string>
  >({});

  async function decide(
    item: PlacementRequestQueueItem,
    action: "APPROVE" | "REJECT",
  ) {
    if(decisionRef.current)return;
    if(pendingId)return;
    const note = notes[item.id]?.trim()??"";
    if (action === "REJECT" && note.length < 3) {
      setValidationError(prev=>({...prev,[item.id]:"Explain why this request is rejected (at least 3 characters)."}));
      showToast({
        tone: "error",
        title: "Decision note required",
        description:
          "Explain why the request is being rejected.",
      });
      return;
    }
    setValidationError(prev=>({...prev,[item.id]:""}));
    decisionRef.current = true;
    setPendingId(item.id);
    try {
      const response = await fetch(
        "/api/placements/requests/" +
          item.id +
          "/actions",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            ...(note ? { note } : {}),
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
            "PLACEMENT_REQUEST_ACTION_FAILED",
        );
      }
      showToast({
        tone: "success",
        title:
          action === "APPROVE"
            ? "Request approved"
            : "Request rejected",
        description:
          action === "APPROVE"
            ? "The approved domain effect was applied in the same transaction."
            : "The placement state was left unchanged.",
      });
      setConfirmation(null);
      router.refresh();
    } catch (error) {
      setValidationError(prev=>({...prev,[item.id]:error instanceof Error?humanize(error.message):"Please try again."}));
      showToast({
        tone: "error",
        title: "Decision failed",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      decisionRef.current = false;
      setPendingId(null);
    }
  }

  if (requests.length === 0) {
    return <section aria-label="Learner requests" className="border-b border-border py-6"><h2 className="font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Learner requests</h2><p className="mt-2 text-sm text-muted-foreground leading-[22px]">No learner requests yet.</p></section>;
  }

  const openCount = requests.filter(
    (item) => item.status === "PENDING",
  ).length;

  return (
    <section className="min-w-0 border-b border-border pb-6">
      <div className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">
              Learner requests
            </h2>
            <p className="mt-1 text-sm text-body leading-[22px]">
              Review exceptional requests here. Approving a request must apply its real domain effect atomically.
            </p>
          </div>
          <StatusBadge
            tone={
              openCount > 0
                ? "warning"
                : "neutral"
            }
          >
            {openCount} pending
          </StatusBadge>
        </div>
      </div>

      <div className="divide-y divide-border">
        {requests.map((item) => {
          const requestedWhen =
            when(
              item.effectPayload[
                item.requestType ===
                "OFFER_EXTENSION"
                  ? "requestedExpiresAt"
                  : "scheduledAt"
              ],
            );
          const requestedMode =
            typeof item.effectPayload['mode'] ===
            "string"
              ? humanize(
                  item.effectPayload['mode'],
                )
              : null;
          const requestedPlace =
            typeof item.effectPayload['venue'] ===
            "string"
              ? item.effectPayload['venue']
              : typeof item.effectPayload['meetingUrl'] === "string"
                ? item.effectPayload['meetingUrl']
                : null;

          return (
            <article
              key={item.id}
              className="min-w-0 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 min-w-0 break-words font-semibold text-foreground">
                    {item.candidateName ??
                      "Learner"}{" "}
                    · {item.roleTitle}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground leading-5">
                    {item.candidateEmail ??
                      "No email"}{" "}
                    ·{" "}
                    {humanize(
                      item.requestType,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    item.status === "APPROVED"
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
                  {humanize(item.status)}
                </StatusBadge>
              </div>

              <p className="mt-3 text-sm text-body leading-[22px]">
                {item.reason}
              </p>

              {item.requestType ===
              "ROUND_RESCHEDULE" ? (
                <div className="mt-3 min-w-0 border-l-2 border-border bg-surface-subtle px-3 py-2 text-sm text-body">
                  <p className="m-0">
                    {item.roundName ??
                      "Round"}{" "}
                    · current{" "}
                    {when(
                      item.roundScheduledAt,
                    ) ?? "not scheduled"}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    Requested{" "}
                    {requestedWhen ??
                      "invalid time"}
                    {requestedMode
                      ? " · " +
                        requestedMode
                      : ""}
                    {requestedPlace
                      ? " · " +
                        requestedPlace
                      : ""}
                  </p>
                </div>
              ) : null}

              {item.requestType ===
              "OFFER_EXTENSION" ? (
                <div className="mt-3 min-w-0 border-l-2 border-border bg-surface-subtle px-3 py-2 text-sm text-body">
                  <p className="m-0">
                    {item.offerRoleTitle ??
                      "Offer"}{" "}
                    · current deadline{" "}
                    {when(
                      item.offerExpiresAt,
                    ) ?? "not set"}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    Requested deadline{" "}
                    {requestedWhen ??
                      "invalid time"}
                  </p>
                </div>
              ) : null}

              {item.status === "PENDING" ? (
                <div className="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <label>
                    <span className="mb-1 block text-xs font-semibold text-body">
                      Decision note
                    </span>
                    <Input
                      className="min-h-11 w-full md:min-h-9"
                      maxLength={1000}
                      placeholder="Optional for approval, required for rejection"
                      value={
                        notes[item.id] ?? ""
                      }
                      onChange={(event)=>{
                        setNotes(current=>({...current,[item.id]:event.target.value}));
                        setValidationError(current=>({...current,[item.id]:""}));
                      }}
                    />
                  </label>
                  {validationError[item.id]?<p role="alert" className="text-sm text-destructive lg:col-span-2 leading-[22px]">{validationError[item.id]}</p>:null}
                  <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
                    <Button
                      size="sm"
                      className="min-h-11 w-full lg:w-auto md:min-h-9"
                      disabled={pendingId !== null}
                      onClick={()=>setConfirmation({item,action:"APPROVE"})}
                    >
                      {pendingId === item.id
                        ? "Saving…"
                        : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      className="min-h-11 w-full lg:w-auto md:min-h-9"
                      variant="secondary"
                      disabled={
                        pendingId !== null
                      }
                      onClick={()=>{
                        if((notes[item.id]?.trim().length??0)<3){
                          setValidationError(prev=>({...prev,[item.id]:"Explain why this request is rejected (at least 3 characters)."}));
                          return;
                        }
                        setConfirmation({item,action:"REJECT"});
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : item.decisionNote ? (
                <p className="mt-3 text-xs text-muted-foreground leading-5">
                  Decision note:{" "}
                  {item.decisionNote}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <ConfirmDialog open={confirmation!==null} pending={pendingId!==null}
        onOpenChange={next=>{if(!next&&!pendingId)setConfirmation(null);}}
        title={confirmation?.action==="APPROVE"?"Approve learner request?":"Reject learner request?"}
        description={confirmation?.action==="APPROVE"
          ?"Approving applies the placement effect immediately."
          :"Reject with the recorded decision note? Placement state will remain unchanged."}
        confirmLabel={confirmation?.action==="APPROVE"?"Approve request":"Reject request"}
        confirmVariant={confirmation?.action==="APPROVE"?"primary":"danger"}
        onConfirm={()=>{if(confirmation)void decide(confirmation.item,confirmation.action);}}/>
    </section>
  );
}
