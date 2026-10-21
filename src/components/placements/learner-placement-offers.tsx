"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { learnerOfferAnchor, learnerOfferHref } from "@/modules/placements/learner-offer-deep-link-model";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { learnerOfferAcceptancePreview } from "@/modules/placements/learner-offer-acceptance-preview";
import {learnerOfferApplicationHref} from "@/modules/placements/learner-offer-application-link-model";
import {learnerOfferResponseTiming,prioritizeLearnerOffers} from "@/modules/placements/learner-offer-response-timing-model";
import {learnerPendingOfferExtensions,type LearnerOfferRequestStatus}
  from "@/modules/placements/learner-offer-pending-request-model";
import {learnerOfferExtensionRequest,learnerOfferExtensionLocalDefault}
  from "@/modules/placements/learner-offer-extension-model";
import { StatusBadge } from "@/components/ui/status-badge";
import {learnerOffersCsv,LEARNER_OFFER_CSV_LIMIT} from "@/modules/placements/learner-offers-csv-model";
import {learnerOfferCtc} from "@/modules/placements/learner-offer-ctc-model";
import {learnerOfferDisplayDate} from "@/modules/placements/learner-offer-display-date-model";
import {learnerOfferActionErrorMessage} from "@/modules/placements/learner-offer-action-error-model";
import { useToast } from "@/components/ui/toast";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

type OfferAcceptImpact={
 offerId:string;offerStatus:string;expiresAt:string|null;blockedByAnotherAcceptedOffer:boolean;
 withdrawn:Array<{id:string;title:string}>;declined:Array<{id:string;title:string}>;
 stayed:Array<{id:string;title:string}>;previewOnly:boolean;
};
export type LearnerPlacementOfferItem = {
  offerId: string;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  roleTitle: string;
  kind?: "OFFER" | "LOI";
  status:
    | "ISSUED"
    | "ACCEPTED"
    | "DECLINED"
    | "WITHDRAWN";
  annualCtcInr: number | null;
  letterHref?: string | null;
  countsAsPlaced?: boolean;
  joiningDate: string | null;
  expiresAt: string | null;
  issuedAt: string;
  /** Imported legacy respondedAt is presentation-only; server owns transitions. */
  respondedAt?: string | null;
  acceptanceChannel?: string | null;
  acceptedDisputableUntil?: string | null;
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
  const amount=learnerOfferCtc(value);
  if (amount===null) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatWhen(value: string | null) {
  return learnerOfferDisplayDate(value);
}

export function LearnerPlacementOffers({
  offers,snapshotNowIso,extensionRequests=[],preserveOrder=false,extensionsAvailable=true,
}: {
  offers: readonly LearnerPlacementOfferItem[];
  snapshotNowIso:string;
  extensionRequests?:readonly LearnerOfferRequestStatus[];
  preserveOrder?:boolean;
  extensionsAvailable?:boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  // Ref lock covers the gap between a click and the pending-state rerender.
  const pendingRef = useRef(false);
  const [confirmOffer, setConfirmOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [acceptImpact,setAcceptImpact]=useState<OfferAcceptImpact|null>(null);
  const [acceptImpactBusy,setAcceptImpactBusy]=useState(false);
  const [acceptImpactError,setAcceptImpactError]=useState<string|null>(null);
  const impactRequest=useRef(0);
  const [declineOffer, setDeclineOffer] = useState<LearnerPlacementOfferItem | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [extensionOffer,setExtensionOffer]=useState<LearnerPlacementOfferItem|null>(null);
  const [extensionAt,setExtensionAt]=useState("");
  const [extensionReason,setExtensionReason]=useState("");
  const [extensionError,setExtensionError]=useState<string|null>(null);
  // Legacy RELEASED maps to ISSUED; legacy REJECTED maps to a DECLINED
  // offer, not a withdrawn application. Canonical statuses come from the API.
  const sortedOffers=preserveOrder?[...offers]:prioritizeLearnerOffers(offers,snapshotNowIso);
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

  async function reviewAccept(item:LearnerPlacementOfferItem){
    const request=++impactRequest.current;
    setConfirmOffer(item);setAcceptImpact(null);setAcceptImpactError(null);
    setAcceptImpactBusy(true);
    try{
      const response=await fetch("/api/placements/offers/"+encodeURIComponent(item.offerId)+"/accept-preview",
        {method:"GET",credentials:"same-origin",cache:"no-store"});
      const payload=await response.json().catch(()=>null) as (OfferAcceptImpact&{error?:string})|null;
      if(!response.ok||!payload||payload.offerId!==item.offerId)
        throw Error(payload?.error??"Could not load the acceptance impact. Please retry.");
      if(request===impactRequest.current)setAcceptImpact(payload);
    }catch(error){
      if(request===impactRequest.current)setAcceptImpactError(error instanceof Error?error.message:"Impact preview is unavailable.");
    }finally{
      if(request===impactRequest.current)setAcceptImpactBusy(false);
    }
  }
  function dismissAccept(){
    impactRequest.current++;
    setConfirmOffer(null);setAcceptImpact(null);setAcceptImpactError(null);
    setAcceptImpactBusy(false);
  }

  async function respond(
    offerId: string,
    action: "ACCEPT" | "DECLINE",
  ) {
    if (pendingRef.current) return;
    pendingRef.current = true;
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
      const payload=await response.json().catch(()=>null) as {
        offer?:{id?:unknown;status?:unknown};error?:unknown;code?:unknown;
      }|null;
      if (!response.ok) {
        const code=typeof payload?.code==="string"?payload.code:
          typeof payload?.error==="string"?payload.error:null;
        throw new Error(code==="PLACEMENT_OFFER_EXPIRED"
          ? "The offer response deadline has passed"
          : learnerOfferActionErrorMessage(response.status,code));
      }
      // Never announce an irreversible response until the canonical offer row
      // confirms that the requested transition was recorded.
      const expected=action==="ACCEPT"?"ACCEPTED":"DECLINED";
      if(payload?.offer?.id!==offerId || payload.offer.status!==expected){
        throw new Error("The response could not be verified. Refresh your offers before trying again.");
      }

      showToast({
        tone: "success",
        title:
          action === "ACCEPT"
            ? "Congratulations! You accepted "+(offers.find(row=>row.offerId===offerId)?.companyName??"the company")+"'s offer."
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
          action==="ACCEPT"?"Could not accept":"Could not decline",
        description:
          error instanceof Error
            ? error.message
            : action === "ACCEPT"
              ? "Could not accept this offer. Please retry."
              : "Could not decline this offer. Please retry.",
      });
    } finally {
      pendingRef.current = false;
      setPendingId(null);
    }
  }

  async function requestExtension(){
    if(!extensionsAvailable || !extensionOffer || pendingId!==null || pendingRef.current || !extensionOffer.expiresAt)return;
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
    pendingRef.current = true;
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
    finally{pendingRef.current=false;setPendingId(null);}
  }
  function downloadOwnOffers(){
    const csv=learnerOffersCsv(sortedOffers);
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    try {
      const link=document.createElement("a");
      link.href=url;
      link.download="my-placement-offers.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {URL.revokeObjectURL(url);}
  }
  if (offers.length === 0) {
    return null;
  }

  return (
    <section id="my-offers" className="scroll-mt-24 space-y-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Offers
        </h2>
        <p className="mt-1 text-sm text-body">
          Review official offers separately from round results and track the joining outcome after acceptance.
        </p>
        </div>
        <Button className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9" type="button" variant="secondary" onClick={downloadOwnOffers}>
          Export displayed offers CSV
        </Button>
      </div>
      {sortedOffers.length>LEARNER_OFFER_CSV_LIMIT ? (
        <p role="status" className="text-xs text-muted-foreground">
          CSV includes the first {LEARNER_OFFER_CSV_LIMIT} of {sortedOffers.length} offers in this view. Narrow your offer filters to export others.
        </p>
      ) : null}
      <div className="min-w-0 divide-y divide-border">
        {sortedOffers.map((item) => (
          <article
            key={item.offerId}
            id={learnerOfferAnchor(item.offerId) ?? undefined}
            className="scroll-mt-24 min-w-0 py-4 first:pt-0 last:pb-0 md:py-5"
          >
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="m-0 break-words text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                  {item.companyName}
                </p>
                <h3 className="mt-1 break-words text-lg font-semibold text-foreground">
                  {item.kind === "LOI" ? "Letter of intent · " : ""}
                  {item.roleTitle}
                </h3>
                <p className="mt-1 break-words text-sm text-body">
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
              <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
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
                  {item.status==="ISSUED" && learnerOfferResponseTiming(item,snapshotNowIso).canRespond ? "Waiting for your reply" : humanize(item.status)}
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

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 break-words text-sm text-body">
              {item.letterHref && item.status==="ACCEPTED" ? (
                <a href={item.letterHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center font-semibold text-primary-text underline focus-visible:underline">
                  Offer letter
                </a>
              ) : null}
              {item.respondedAt && (item.status==="ACCEPTED" || item.status==="DECLINED") ? (
                 <span>Responded: {formatWhen(item.respondedAt) ?? "Date unavailable"} (IST)</span>
               ) : null}
              {item.countsAsPlaced===false ? (
                <span>Counts as placed: No (internship or letter of intent)</span>
              ) : item.countsAsPlaced===true ? (
                <span>Counts as placed: Yes</span>
              ) : null}
            </div>

            <nav aria-label={`Offer links for ${item.companyName}`} className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {learnerOfferApplicationHref(item.applicationId) ? (
                <Link href={learnerOfferApplicationHref(item.applicationId)!}
                  className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">
                  View related application
                </Link>
              ) : null}
              {learnerOfferHref(item.offerId) ? (
                <Link href={learnerOfferHref(item.offerId)!}
                  className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">
                  Link to this offer
                </Link>
              ) : null}
            </nav>
            <div className="mt-3 grid min-w-0 gap-x-4 gap-y-2 break-words border-t border-border pt-3 text-sm text-body sm:grid-cols-2 lg:grid-cols-3">
              <p className="m-0">
                <span className="font-semibold text-foreground">
                  Issued:
                </span>{" "}
                {formatWhen(item.issuedAt) ?? "Date unavailable"}
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

            {item.status==="ACCEPTED" && item.acceptanceChannel==="EXTERNAL_IMPORT" ? (
              <aside role="status" className="mt-4 rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-4 text-sm text-body">
                <p>The company told us you accepted this offer. If that is wrong, tell the placement cell
                  {item.acceptedDisputableUntil ? " before "+(formatWhen(item.acceptedDisputableUntil)??"the recorded deadline")+" IST." : "."}
                </p>
                {item.acceptedDisputableUntil &&
                  Number.isFinite(Date.parse(item.acceptedDisputableUntil)) &&
                  Number.isFinite(Date.parse(snapshotNowIso)) &&
                  Date.parse(item.acceptedDisputableUntil)>Date.parse(snapshotNowIso) ? (
                    <Link className="mt-2 inline-flex min-h-[var(--lms-control-height)] max-md:min-h-11 items-center font-semibold text-primary-text underline focus-visible:underline"
                      href={"/learn/my-placements/placement?"+new URLSearchParams({
                        request:"acceptance-dispute",offerId:item.offerId,
                      }).toString()+"#requests"}>
                      Tell the placement cell
                    </Link>
                  ) : <p className="mt-2">The recorded dispute window has ended. Contact your placement team for help.</p>}
              </aside>
            ) : null}
            {pendingExtensions.has(item.offerId) ? (
              <p role="status" className="mt-4 text-sm font-semibold text-body">
                Offer deadline extension requested. Your placement team has not approved it yet.
                {" "}
                <Link href="/learn/my-placements/support?status=PENDING&type=OFFER_EXTENSION"
                  className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9 focus-visible:underline">Review pending request</Link>
              </p>
            ) : null}
            {learnerOfferResponseTiming(item,snapshotNowIso).urgency==="INVALID" ? (
              <p role="alert" className="mt-4 text-sm font-semibold text-error">
                The saved offer dates cannot be verified. Responding is disabled until your placement cell corrects the record.
              </p>
            ) : learnerOfferResponseTiming(item,snapshotNowIso).urgency==="EXPIRED" ? (
              <p role="status" className="mt-4 text-sm font-semibold text-error">
                The offer response deadline has passed
              </p>
            ) : learnerOfferResponseTiming(item,snapshotNowIso).urgency==="SOON" ? (
              <p role="status" className={"mt-4 text-sm font-semibold "+(item.expiresAt && Date.parse(item.expiresAt)-Date.parse(snapshotNowIso)<=86400000?"text-error":"text-warning")}>
                {item.expiresAt && Date.parse(item.expiresAt)-Date.parse(snapshotNowIso)<=86400000
                  ? "Response due within 24 hours. Review the offer terms before confirming."
                  : "Response due within 48 hours. Review the offer terms before confirming."}
              </p>
            ) : null}

            {learnerOfferResponseTiming(item,snapshotNowIso).canRespond ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                  size="sm"
                  disabled={
                    pendingId !== null
                  }
                  onClick={() => void reviewAccept(item)}
                >
                  {pendingId ===
                  item.offerId
                    ? "Saving…"
                    : "Accept offer"}
                </Button>
                <Button className="min-h-11 w-full sm:w-auto md:min-h-9"
                  size="sm"
                  variant="danger"
                  disabled={
                    pendingId !== null
                  }
                  onClick={() => { setDeclineReason(""); setDeclineOffer(item); }}
                >
                  Decline
                </Button>
                {item.letterHref && item.status==="ISSUED" ? <a href={item.letterHref} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-body hover:border-primary hover:text-primary-text sm:w-auto md:min-h-9">Offer letter</a> : null}
                {extensionsAvailable && item.expiresAt && !pendingExtensions.has(item.offerId) ? (
                  <Button className="min-h-11 w-full sm:w-auto md:min-h-9" size="sm" variant="secondary" disabled={pendingId!==null}
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
              <div className="mt-4 border-t border-border pt-3 text-sm text-body">
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
        footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingId!==null} onClick={()=>setExtensionOffer(null)}>
            Keep current deadline
          </Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pendingId!==null} onClick={()=>void requestExtension()}>
            {pendingId!==null?"Submitting…":"Confirm extension request"}
          </Button>
        </div>}>
        {extensionOffer?<div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {extensionOffer.companyName} · {extensionOffer.roleTitle}
          </p>
          <p className="text-sm text-body">
            Recorded response deadline: {formatWhen(extensionOffer.expiresAt)} (IST)
          </p>
          <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Requested new deadline (IST)
            <Input type="datetime-local" value={extensionAt}
              onChange={event=>setExtensionAt(event.target.value)}
              className="mt-1 w-full"/>
          </label>
          <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
            Reason
            <Textarea rows={3} maxLength={2000} value={extensionReason}
              onChange={event=>setExtensionReason(event.target.value)}
              className="mt-1 w-full"/>
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
        title={declineOffer?"Decline "+declineOffer.companyName+"\u0027s offer?":"Decline offer?"}
        description="This cannot be undone. The placement cell receives a record of your response; company notification depends on the recruitment workflow."
        footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingId !== null} onClick={() => setDeclineOffer(null)}>
            Cancel
          </Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="danger" disabled={pendingId !== null || declineReason.length > 2000}
            onClick={() => { if (declineOffer) void respond(declineOffer.offerId, "DECLINE"); }}>
            {pendingId !== null ? "Saving…" : "Decline"}
          </Button>
        </div>}
      >
        {declineOffer ? <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {declineOffer.companyName} · {declineOffer.roleTitle}
          </p>
          <p className="text-sm text-body">
            Recorded CTC: {formatMoney(declineOffer.annualCtcInr) ?? "Not specified"}.
            The server rechecks the status and deadline on confirmation.
          </p>
          <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]" htmlFor="offer-decline-reason">
            Reason (optional, up to 2000 characters)
          </label>
          <Textarea id="offer-decline-reason" rows={3} maxLength={2000} value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            className="w-full" />
        </div> : null}
      </Dialog>
      <Dialog
        open={confirmOffer !== null}
        onOpenChange={(open) => { if (!open && pendingId === null) dismissAccept(); }}
        title={confirmOffer?"Accept "+confirmOffer.companyName+"\u0027s offer?":"Accept offer?"}
        description="Review the recorded offer terms. Acceptance is only submitted after you confirm."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pendingId !== null}
              onClick={dismissAccept}>Cancel</Button>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={!preview?.canConfirm || !acceptImpact || acceptImpactBusy || Boolean(acceptImpactError) || acceptImpact.blockedByAnotherAcceptedOffer || pendingId !== null}
              onClick={() => { if (preview?.canConfirm) void respond(preview.offerId, "ACCEPT"); }}>
              {pendingId !== null ? "Saving…" : "Yes, accept"}
            </Button>
          </div>
        }
      >
        {preview ? (
          <div className="space-y-3 text-sm text-body">
            <p className="font-semibold text-foreground">{preview.companyName} · {preview.roleTitle}</p>
            <p>Drive: {preview.jobTitle}</p>
            <p>Annual CTC: {formatMoney(preview.annualCtcInr) ?? "Not specified"}</p>
            <p>Planned joining: {preview.joiningDate ?? "Not specified"}</p>
            <p>Response deadline: {formatWhen(preview.expiresAt) ?? "No expiry specified"}</p>
            {acceptImpactBusy?<p role="status" aria-live="polite" className="text-sm text-body">Checking the applications and offers this acceptance would change…</p>:null}
            {acceptImpactError?<p role="alert" className="text-sm text-error">{acceptImpactError}
              <Button className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" variant="link" onClick={()=>{if(confirmOffer)void reviewAccept(confirmOffer);}}>Retry impact preview</Button>
            </p>:null}
            {acceptImpact?<div className="space-y-2 border-b border-border py-3">
              <h3 className="font-semibold text-foreground">What accepting this offer changes</h3>
              {([
                ["Withdrawn",acceptImpact.withdrawn],
                ["Other offers declined",acceptImpact.declined],
                ["You stay in",acceptImpact.stayed],
              ] as const).map(([label,rows])=><div key={label}>
                <p className="font-semibold">{label} ({rows.length})</p>
                {rows.length?<ul className="list-disc pl-5">{rows.map(row=><li key={row.id}>{row.title}</li>)}</ul>:
                <p className="text-xs text-muted-foreground">None</p>}
              </div>)}
              {!acceptImpact.withdrawn.length&&!acceptImpact.declined.length&&!acceptImpact.stayed.length?
                <p className="text-sm font-medium">Nothing else changes.</p>:null}
              <p className="text-xs text-muted-foreground">Withdrawn applications leave the active placement process. Other offers declined cannot be accepted; applications under You stay in remain active under your college rules.</p>
              {acceptImpact.blockedByAnotherAcceptedOffer?<p role="alert" className="font-semibold text-error">
                Another accepted offer is already recorded. You cannot accept this offer until the placement cell resolves the conflict.
              </p>:null}
              <p className="text-xs text-muted-foreground">These are current records only. The final transaction rechecks the impacts before changing anything.</p>
            </div>:null}
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
