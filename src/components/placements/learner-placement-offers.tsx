"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";
import {learnerOfferResponseTiming,prioritizeLearnerOffers} from "@/modules/placements/learner-offer-response-timing-model";
import {learnerPendingOfferExtensions,type LearnerOfferRequestStatus}
  from "@/modules/placements/learner-offer-pending-request-model";
import {learnerOfferExtensionRequest,learnerOfferExtensionLocalDefault}
  from "@/modules/placements/learner-offer-extension-model";
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
  offers,snapshotNowIso,extensionRequests=[],
}: {
  offers: readonly LearnerPlacementOfferItem[];
  snapshotNowIso:string;
  extensionRequests?:readonly LearnerOfferRequestStatus[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  const [confirmOffer, setConfirmOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [declineOffer, setDeclineOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [extensionOffer,setExtensionOffer]=useState<LearnerPlacementOfferItem|null>(null);
  const [extensionAt,setExtensionAt]=useState("");
  const [extensionReason,setExtensionReason]=useState("");
  const [extensionError,setExtensionError]=useState<string|null>(null);
  const sortedOffers=prioritizeLearnerOffers(offers,snapshotNowIso);
  const pendingExtensions=learnerPendingOfferExtensions(extensionRequests);
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
      },new Date(snapshotNowIso))
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

  async function requestExtension(){
    if(!extensionOffer || pendingId!==null || !extensionOffer.expiresAt)return;
    let input:ReturnType<typeof learnerOfferExtensionRequest>;
    try{
      input=learnerOfferExtensionRequest({
        offerId:extensionOffer.offerId,applicationId:extensionOffer.applicationId,
        status:extensionOffer.status,expectedExpiresAt:extensionOffer.expiresAt,
        requestedLocalAt:extensionAt,reason:extensionReason,confirmed:true,
      },snapshotNowIso);
    }catch{
      setExtensionError("Choose a later valid IST deadline and enter a reason (3–2000 characters).");
      return;
    }
    setPendingId(extensionOffer.offerId);setExtensionError(null);
    try{
      const response=await fetch("/api/placements/requests",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify(input),
      });
      if(!response.ok)throw new Error("Could not request an extension. Your offer deadline has not changed.");
      setExtensionOffer(null);setExtensionReason("");
      showToast({tone:"success",title:"Extension request submitted",
        description:"Your placement team must approve the request before the offer deadline changes."});
      router.refresh();
    }catch(error){setExtensionError(error instanceof Error?error.message:"Unable to request extension.");}
    finally{setPendingId(null);}
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
        {sortedOffers.map((item) => (
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

            {pendingExtensions.has(item.offerId) ? (
              <p role="status" className="mt-4 text-sm font-semibold text-body">
                Offer deadline extension requested. Your placement team has not approved it yet.
                {" "}
                <Link href="/learn/my-placements/support?status=PENDING&type=OFFER_EXTENSION"
                  className="text-primary-text underline">Review pending request</Link>
              </p>
            ) : null}
            {learnerOfferResponseTiming(item,snapshotNowIso).urgency==="EXPIRED" ? (
              <p role="status" className="mt-4 text-sm font-semibold text-error">
                The recorded response deadline has passed. You cannot respond to this offer.
                Contact your placement cell for clarification.
              </p>
            ) : learnerOfferResponseTiming(item,snapshotNowIso).urgency==="SOON" ? (
              <p role="status" className="mt-4 text-sm font-semibold text-warning">
                Response due within 48 hours. Review the offer terms before confirming.
              </p>
            ) : null}

            {learnerOfferResponseTiming(item,snapshotNowIso).canRespond ? (
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
                {item.expiresAt && !pendingExtensions.has(item.offerId) ? (
                  <Button size="sm" variant="secondary" disabled={pendingId!==null}
                    onClick={()=>{
                      setExtensionOffer(item);
                      setExtensionAt(learnerOfferExtensionLocalDefault(item.expiresAt!));
                      setExtensionReason("");setExtensionError(null);
                    }}>
                    Request more time
                  </Button>
                ):null}
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

      <Dialog open={extensionOffer!==null}
        onOpenChange={open=>{if(!open&&pendingId===null)setExtensionOffer(null);}}
        title="Request an offer deadline extension"
        description="This sends an in-app request to your placement team; it does not change or accept the offer."
        footer={<>
          <Button variant="secondary" disabled={pendingId!==null} onClick={()=>setExtensionOffer(null)}>
            Keep current deadline
          </Button>
          <Button disabled={pendingId!==null} onClick={()=>void requestExtension()}>
            {pendingId!==null?"Submitting…":"Confirm extension request"}
          </Button>
        </>}>
        {extensionOffer?<div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {extensionOffer.companyName} · {extensionOffer.roleTitle}
          </p>
          <p className="text-sm text-body">
            Recorded response deadline: {formatWhen(extensionOffer.expiresAt)} (IST)
          </p>
          <label className="block text-sm font-semibold text-foreground">
            Requested new deadline (IST)
            <input type="datetime-local" value={extensionAt}
              onChange={event=>setExtensionAt(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"/>
          </label>
          <label className="block text-sm font-semibold text-foreground">
            Reason
            <textarea rows={3} maxLength={2000} value={extensionReason}
              onChange={event=>setExtensionReason(event.target.value)}
              className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface p-3 text-sm"/>
          </label>
          {extensionError?<p role="alert" className="text-sm text-error">{extensionError}</p>:null}
          <p className="text-xs text-muted-foreground">
            The placement team reviews this request. The original offer remains unchanged until approval.
          </p>
        </div>:null}
      </Dialog>
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
