import { z } from "zod";

/** TPO-drives-03: "Closed" is a view of both normal closures and cancellations.
 * Do not include rejected recruiter requests: those are not placement jobs. */
export const TPO_CLOSED_JOB_STATUSES = ["CLOSED", "CANCELLED"] as const;
export function isTpoClosedJobStatus(status: string): status is (typeof TPO_CLOSED_JOB_STATUSES)[number] {
  return status === "CLOSED" || status === "CANCELLED";
}
/** TPO-drives-04: explicit All view remains possible; first visit prioritizes review. */
export function defaultTpoDriveView(pending:number,explicit?:"ALL"|"REQUESTS"|"DRAFT"|"LIVE"|"CLOSED"){
 return explicit??(pending>0?"REQUESTS":"LIVE");
}

export const tpoDriveLifecycleQuerySchema = z.object({
  seasonId: z.string().uuid().optional(),
  companyId:z.string().uuid().optional(),
  cohortId:z.string().uuid().optional(),
  ownerUserId:z.string().uuid().optional(),
  view: z.enum(["ALL", "REQUESTS", "DRAFT", "LIVE", "CLOSED"]).default("ALL"),
  search:z.string().trim().max(100).default(""),
  deadline:z.enum(["ALL","TODAY","DUE_SOON","LATER","OVERDUE","UNSET"]).default("ALL"),
  workMode:z.enum(["ALL","ONSITE","REMOTE","HYBRID"]).default("ALL"),
  /** Campus participation mode is independent of the employee's work location. */
  recruiterDriveMode:z.enum(["ALL","ON_CAMPUS","POOL","OFF_CAMPUS"]).default("ALL"),
  employmentType:z.enum(["ALL","FULL_TIME","INTERNSHIP","CONTRACT"]).default("ALL"),
  jobTypeLabel:z.string().trim().min(2).max(40).optional(),
  minApplied:z.coerce.number().int().min(0).max(100000).optional(),
  maxApplied:z.coerce.number().int().min(0).max(100000).optional(),
  minOffers:z.coerce.number().int().min(0).max(100000).optional(),
  maxOffers:z.coerce.number().int().min(0).max(100000).optional(),
  payCategory:z.enum(["ALL","REGULAR","DREAM"]).default("ALL"),
  attention:z.enum(["ALL","NO_APPLICANTS","NO_DEADLINE","DUE_SOON","OVERDUE"]).default("ALL"),
  journey:z.enum(["ALL","TAKING_APPLICATIONS","RUNNING_ROUNDS","OFFERS_ISSUED","COMPLETE"]).default("ALL"),
  display:z.enum(["DETAILED","COMPACT"]).default("DETAILED"),
  sort:z.enum(["COMPANY","DEADLINE_ASC","DEADLINE_DESC"]).default("COMPANY"),
  page:z.coerce.number().int().min(1).max(100000).default(1),
}).strict().superRefine((query,ctx)=>{
 if(query.minApplied!==undefined&&query.maxApplied!==undefined&&query.maxApplied<query.minApplied)
  ctx.addIssue({code:"custom",path:["maxApplied"],message:"Maximum applied cannot be below minimum applied"});
 if(query.minOffers!==undefined&&query.maxOffers!==undefined&&query.maxOffers<query.minOffers)
  ctx.addIssue({code:"custom",path:["maxOffers"],message:"Maximum offers cannot be below minimum offers"});
});
export const TPO_DRIVE_PAGE_SIZE=25;
export function tpoDriveLifecyclePage(total:number,requestedPage:number){
 const totalPages=Math.max(1,Math.ceil(total/TPO_DRIVE_PAGE_SIZE));
 const page=Math.min(requestedPage,totalPages);
 return {page,totalPages,totalMatching:total,pageSize:TPO_DRIVE_PAGE_SIZE,
  offset:(page-1)*TPO_DRIVE_PAGE_SIZE};
}
export type TpoLifecycleFact = {
  id: string; title: string; company: string; status: string;
  workMode: string; employmentType: string; jobTypeLabel?:string|null; applicationDeadline: string | null;
};
export function projectTpoDriveLifecycle(
  facts: readonly TpoLifecycleFact[], view: "ALL" | "REQUESTS" | "DRAFT" | "LIVE" | "CLOSED",
  nowIso: string,
) {
  const now = Date.parse(nowIso);
  if (!Number.isFinite(now)) throw new Error("Invalid report clock");
  const counts = {
    total: facts.length,
    drafts: facts.filter((f) => f.status === "DRAFT").length,
    live: facts.filter((f) => f.status === "PUBLISHED").length,
    closed: facts.filter((f) => isTpoClosedJobStatus(f.status)).length,
    deadlinesNextSevenDays: facts.filter((f) => {
      if (f.status !== "PUBLISHED" || !f.applicationDeadline) return false;
      const due = Date.parse(f.applicationDeadline);
      return Number.isFinite(due) && due >= now && due <= now + 7 * 86_400_000;
    }).length,
  };
  const target = view === "DRAFT" ? "DRAFT" : view === "LIVE" ? "PUBLISHED" :
    view === "CLOSED" ? "CLOSED" : null;
  return { counts,
    rows: facts.filter((f) => view==="CLOSED"?
      isTpoClosedJobStatus(f.status):target === null || f.status === target)
      .sort((a,b) => a.company.localeCompare(b.company) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
  };
}

export const TPO_REQUESTS_COPY = {
  tab: "Requests",
  unavailable: "Drive requests are not available until the recruiter request workflow is enabled.",
  needsReview: "Needs your review",
  sentBack: "Sent back",
} as const;
export function driveRequestStatusTone(status:string):"warning"|"info"|"neutral"|"error"{
 if(status==="REQUEST")return "warning";
 if(status==="SENT_BACK")return "info";
 if(status==="REJECTED")return "error";
 return "neutral";
}
export function driveRequestStatusLabel(status:string) {
  if(status==="REQUEST")return TPO_REQUESTS_COPY.needsReview;
  if(status==="SENT_BACK")return TPO_REQUESTS_COPY.sentBack;
  if(status==="DRAFT")return "Approved, not yet live";
  if(status==="REJECTED")return "Declined";
  return "Cancelled";
}

/** TPO-drives-R04: cancellation and ordinary closure must not share a tag. */
export function tpoDriveStatusTone(status:string):"success"|"warning"|"info"|"neutral"|"error"{
 if(status==="PUBLISHED")return "success";
 if(status==="DRAFT")return "info";
 if(status==="CANCELLED")return "error";
 if(status==="CLOSED")return "neutral";
 return "warning";
}
/** A published drive can be past its application deadline while interviews
 * and offers remain active. Expiry closes applications, not the hiring process.
 */
export function tpoDriveApplicationsClosed(
 status:string,deadline:string|null|undefined,nowIso:string,
):boolean{
 if(status!=="PUBLISHED"||!deadline)return false;
 const due=Date.parse(deadline),now=Date.parse(nowIso);
 return Number.isFinite(due)&&Number.isFinite(now)&&due<=now;
}
export function tpoDriveStatusLabel(status:string,deadline?:string|null,nowIso?:string){
 if(status==="CANCELLED")return "Cancelled";
 if(status==="CLOSED")return "Closed";
 if(status==="PUBLISHED")
  return nowIso&&tpoDriveApplicationsClosed(status,deadline,nowIso)
   ?"Applications closed":"Live";
 return status==="DRAFT"?"Draft":status;
}

/** TPO-drives-05: concise lifecycle cue from real persisted job and round facts. */
export function tpoDriveWhereItIs(job:{
 status:string;applicationDeadline:string|null;roundCount:number;roundsCompleted:number;
 nextRoundAt:string|null;offersMade:number;
},nowIso:string){
 if(job.status==="DRAFT")return "Draft · needs publishing";
 if(job.status==="CANCELLED")return "Cancelled";
 if(job.status==="CLOSED")return "Closed";
 if(job.status!=="PUBLISHED")return job.status;
 if(!job.applicationDeadline){
  if(job.offersMade>0&&job.roundsCompleted>=job.roundCount)
   return "Offers · "+job.offersMade+" issued/accepted";
  if(job.roundCount>0&&job.roundsCompleted>0)
   return "Rounds "+job.roundsCompleted+" of "+job.roundCount+" done · deadline not set";
  return "Taking applications · no deadline";
 }
 if(!tpoDriveApplicationsClosed(job.status,job.applicationDeadline,nowIso))
  return "Taking applications";
 if(job.offersMade>0&&job.roundsCompleted>=job.roundCount)
  return "Offers · "+job.offersMade+" issued/accepted";
 if(job.roundCount>0){
  const next=job.nextRoundAt?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",
   timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(job.nextRoundAt))+" IST":"No upcoming date";
  return "Rounds "+job.roundsCompleted+" of "+job.roundCount+" done · "+next;
 }
 if(job.offersMade>0)return "Offers · "+job.offersMade+" issued/accepted";
 return "Applications closed";
}

/** Human-readable display: preserve persisted work-mode semantics rather than
 * mapping HYBRID to legacy Pool or REMOTE to Off-campus without evidence. */
export function tpoDriveEmploymentLabel(value:string):string{
 if(value==="FULL_TIME")return "Full-time";
 if(value==="INTERNSHIP")return "Internship";
 if(value==="CONTRACT")return "Contract";
 return "Not chosen";
}
export function tpoDriveWorkModeLabel(value:string):string{
 if(value==="ONSITE")return "On-site";
 if(value==="REMOTE")return "Remote";
 if(value==="HYBRID")return "Hybrid";
 return "Not chosen";
}

/** A displayed request can outlive its recruiter's college access. Null
 * validity is deliberately expired, matching the live grant authorization.
 * Status and DRIVE capability are required regardless of company trust. */
export function tpoRecruiterRequestAccessEnded(
 grant:{status:string;validUntil:Date|null;capabilities:readonly string[]}|null,
 platformStatus:string,now:Date,
):boolean{
 return platformStatus!=="ACTIVE"||!grant||grant.status!=="ACTIVE"||
  !grant.validUntil||grant.validUntil.getTime()<=now.getTime()||
  !grant.capabilities.includes("DRIVES");
}

