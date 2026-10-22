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
  companyLogoUrl?:string|null;
  jobId?:string|null;
  roleOption?:string|null;
  jobType?:string|null;
  /** Source decimal CTC survives alongside rounded INR. */
  legacyCtcLpa?:string|null;
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

function offerCtcLpa(item:LearnerPlacementOfferItem):string|null{
  const saved=item.legacyCtcLpa?.trim();
  if(saved && /^\d+(?:\.\d+)?$/.test(saved) && Number.isFinite(Number(saved)))
    return String(Number(saved));
  const amount=learnerOfferCtc(item.annualCtcInr);
  return amount===null?null:String(Number((amount/100000).toFixed(2)));
}
function offerStatusText(item:LearnerPlacementOfferItem,now:string){
  if(item.status==="WITHDRAWN")return "Withdrawn by the company";
  if(item.status==="ISSUED"){
    const timing=learnerOfferResponseTiming(item,now);
    return timing.urgency==="EXPIRED"?"Expired: no reply in time":"Waiting for your reply";
  }
  return humanize(item.status);
}
function offerJobHref(item:LearnerPlacementOfferItem):string|null{
  return item.jobId&&/^[0-9a-f-]{8,64}$/i.test(item.jobId)
    ? "/learn/my-placements/jobs/"+encodeURIComponent(item.jobId):null;
}
function safePublicOfferLogo(url:string|null|undefined){
  if(!url)return null;
  try{
    const parsed=new URL(url);
    return parsed.protocol==="https:"&&!parsed.username&&!parsed.password
      ?parsed.toString():null;
  }catch{return null;}
}

/** Migration: RELEASED/OFFERED→ISSUED; HIRED→ACCEPTED;
 * REJECTED→DECLINED. Joining and expiry remain distinct facts. */
export function legacyOfferResponseState(
  state:"RELEASED"|"OFFERED"|"HIRED"|"REJECTED"|"EXPIRED"|"WITHDRAWN",
):LearnerPlacementOfferItem["status"]{
  switch(state){
    case "RELEASED":case "OFFERED":case "EXPIRED":return "ISSUED";
    case "HIRED":return "ACCEPTED";
    case "REJECTED":return "DECLINED";
    case "WITHDRAWN":return "WITHDRAWN";
  }
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
    return <section id="my-offers" aria-labelledby="sp-off-empty" className="space-y-3">
      <h2 id="sp-off-empty" className="text-lg font-semibold text-foreground">No offers yet</h2>
      <p className="text-sm text-body">When a company selects you and the placement cell releases the offer, it shows here and you get a notice. You&apos;ll have time to read it and decide.{" "}
        <Link href="/learn/my-placements/applications" className="font-semibold text-link underline">See where your applications stand</Link>
      </p>
    </section>;
  }

  return (
    <section id="my-offers" aria-label="My placement offers" className="scroll-mt-24 space-y-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="min-w-0 text-sm text-body">Review each offer, its reply deadline and joining terms before responding.</p>
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
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle text-base font-bold text-primary-text" aria-hidden="true">
                  {safePublicOfferLogo(item.companyLogoUrl) ? (
                    <img alt="" src={safePublicOfferLogo(item.companyLogoUrl)!}
                      width={44} height={44} loading="lazy" className="size-11 object-contain"/>
                  ) : <span aria-hidden="true">{item.companyName.trim().slice(0,2).toUpperCase()||"CO"}</span>}
                </span>
                <div className="min-w-0">
                  <p className="m-0 break-words text-sm font-semibold text-foreground">{item.companyName}</p>
                  <h3 className="mt-1 break-words text-base font-semibold text-foreground">
                    {offerJobHref(item) ? (
                      <Link href={offerJobHref(item)!} className="text-link hover:underline focus-visible:underline">
                        {item.roleTitle}{item.roleOption ? " · "+item.roleOption : ""}
                      </Link>
                    ) : <span>{item.roleTitle}{item.roleOption ? " · "+item.roleOption : ""}</span>}
                  </h3>
                  <p className="mt-1 break-words text-sm text-body">
                    {item.kind==="LOI"?"Letter of intent · ":""}{item.jobTitle}
                  </p>
                </div>
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
                  {offerStatusText(item,snapshotNowIso)}
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
            <dl className="mt-3 grid min-w-0 gap-x-4 gap-y-3 border-t border-border pt-3 text-sm text-body sm:grid-cols-2">
              {offerCtcLpa(item)!==null ? <div>
                <dt className="text-xs text-muted-foreground">{item.jobType?.toUpperCase()==="INTERNSHIP"?"Stipend / CTC":"CTC"}</dt>
                <dd className="mt-1 font-semibold text-foreground">₹{offerCtcLpa(item)} LPA</dd>
              </div>:null}
              {item.joiningDate ? <div>
                <dt className="text-xs text-muted-foreground">Joining</dt>
                <dd className="mt-1 font-semibold text-foreground">{formatWhen(item.joiningDate)??item.joiningDate}</dd>
              </div>:null}
              {item.status==="ISSUED"&&item.expiresAt ? <div>
                <dt className="text-xs text-muted-foreground">Reply by</dt>
                <dd className={"mt-1 font-semibold "+(learnerOfferResponseTiming(item,snapshotNowIso).urgency==="EXPIRED"||
                  Date.parse(item.expiresAt)-Date.parse(snapshotNowIso)<86400000?"text-error":"text-foreground")}>
                  {formatWhen(item.expiresAt)??"Date unavailable"} · {(() => {
                    const left=Date.parse(item.expiresAt)-Date.parse(snapshotNowIso);
                    if(!Number.isFinite(left))return "Time unavailable";
                    if(left<=0)return "Deadline passed";
                    if(left<3600000)return Math.ceil(left/60000)+" minutes left";
                    if(left<86400000)return Math.ceil(left/3600000)+" hours left";
                    return Math.ceil(left/86400000)+" days left";
                  })()}
                </dd>
              </div>:null}
              {item.respondedAt && item.status!=="ISSUED" ? <div>
                <dt className="text-xs text-muted-foreground">{item.status==="ACCEPTED"?"Accepted":"Answered"}</dt>
                <dd className="mt-1 font-semibold text-foreground">{formatWhen(item.respondedAt)??"Date unavailable"} (IST)</dd>
              </div>:null}
              {item.countsAsPlaced===false ? <div>
                <dt className="text-xs text-muted-foreground">Counts as placed</dt>
                <dd className="mt-1 font-semibold text-foreground">No (internship)</dd>
              </div>:null}
            </dl>

            {item.status==="ACCEPTED" && item.acceptanceChannel==="EXTERNAL_IMPORT" ? (
              <aside aria-label="Externally reported offer acceptance" className="mt-4 rounded-[var(--lms-control-radius)] border border-warning bg-warning-subtle p-4 text-sm text-body">
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
                Expired: no reply in time
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
                {item.letterHref && item.status==="ISSUED" ? <a href={item.letterHref} rel="noopener noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-3 text-sm font-semibold text-body hover:border-primary hover:text-primary-text sm:w-auto md:min-h-9">View offer letter</a> : null}
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

      <p className="text-sm text-muted-foreground">
        Need more time on an offer, or got an offer outside campus?{" "}
        <Link href="/learn/my-placements/placement#requests" className="font-semibold text-link underline">
          Send a request to the placement cell
        </Link>.
      </p>

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
        description="This cannot be undone. The placement cell is told; the company is notified when its recruiting workflow supports it."
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
            Recorded CTC: {offerCtcLpa(declineOffer)!==null?"₹"+offerCtcLpa(declineOffer)+" LPA":"Not specified"}.
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
            <p>CTC: {confirmOffer&&offerCtcLpa(confirmOffer)!==null?"₹"+offerCtcLpa(confirmOffer)+" LPA":"Not specified"}</p>
            <p>Planned joining: {preview.joiningDate ?? "Not specified"}</p>
            <p>Response deadline: {formatWhen(preview.expiresAt) ?? "No expiry specified"}</p>
            {acceptImpactBusy?<div role="status" aria-live="polite" className="space-y-2" aria-label="Checking acceptance impacts">
              <p className="text-sm text-body">Checking the applications and offers this acceptance would change…</p>
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted"/><div className="h-4 w-3/5 animate-pulse rounded bg-muted"/><div className="h-4 w-2/3 animate-pulse rounded bg-muted"/>
            </div>:null}
            {acceptImpactError?<div role="alert" className="space-y-2 text-sm text-error">
              <p className="font-semibold">We couldn&apos;t check what accepting will change</p>
              <p>Accepting can end your other applications and offers. Check again before you accept.</p>
              <p className="text-xs">{acceptImpactError}</p>
              <Button className="min-h-11 sm:min-h-9" type="button" variant="secondary"
                onClick={()=>{if(confirmOffer)void reviewAccept(confirmOffer);}}>Check again</Button>
            </div>:null}
            {acceptImpact?<div className="space-y-2 border-b border-border py-3">
              <h3 className="font-semibold text-foreground">What accepting this offer changes</h3>
              {([
                ["Withdrawn",acceptImpact.withdrawn,"These applications end."],
                ["Other offers declined",acceptImpact.declined,"These offers are turned down for you."],
                ["You stay in",acceptImpact.stayed,"These carry on as before."],
              ] as const).filter(([,rows])=>rows.length>0).map(([label,rows,note])=>(
                <section key={label} aria-label={label}>
                  <h4 className="font-semibold">{label} ({rows.length})</h4>
                  <p className="text-xs text-muted-foreground">{note}</p>
                  <ul className="list-disc pl-5">{rows.map(row=><li key={row.id}>{row.title}</li>)}</ul>
                </section>
              ))}
              {!acceptImpact.withdrawn.length&&!acceptImpact.declined.length&&!acceptImpact.stayed.length?
                <p className="text-sm font-medium">Nothing else changes: you have no other active applications or offers.</p>:null}
              <p className="text-xs text-muted-foreground"><Link href="/learn/my-placements/placement#rules" className="text-link underline">How your college&apos;s rules decide this</Link></p>
              {acceptImpact.blockedByAnotherAcceptedOffer?<p role="alert" className="font-semibold text-error">
                Another accepted offer is already recorded. You cannot accept this offer until the placement cell resolves the conflict.
              </p>:null}
              <p className="text-xs text-muted-foreground">The placement cell receives the response immediately. Company notification depends on the recruiting workflow. These are current records only; the final transaction rechecks every impact.</p>
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
