export type ApplicationStatusEvent = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  occurredAt: Date;
};

/** Historical rejection uses the PREVIOUS recorded stage, not a guessed
 * current application status. Unknown stages keep neutral copy.
 */
export function learnerApplicationRejectionLabel(priorStage:string|null):string{
 switch(priorStage?.toUpperCase()){
  case "APPLIED":
  case "SUBMITTED":
  case "SHORTLISTED":return "Not shortlisted";
  case "ASSESSMENT":return "Not cleared: Assessment";
  case "INTERVIEW":return "Not cleared: Interview";
  case "WAITLISTED":return "Waitlist ended";
  default:return "Application status updated";
 }
}
export function learnerApplicationHistoryTimeline(
  events: readonly ApplicationStatusEvent[],
) {
  return [...events]
    .sort(
      (a, b) =>
        a.occurredAt.getTime() - b.occurredAt.getTime() ||
        a.id.localeCompare(b.id),
    )
    .map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      occurredAt: event.occurredAt,
      label: event.toStatus === "SUBMITTED"
        ? "Application submitted"
        : event.toStatus === "WITHDRAWN"
          ? "Application withdrawn"
          : event.toStatus === "REJECTED"
            ? learnerApplicationRejectionLabel(event.fromStatus)
            : event.toStatus === "APPLIED"
              ? "Application received"
              : event.toStatus === "SHORTLISTED"
                ? "Shortlisted"
                : event.toStatus === "ASSESSMENT"
                  ? "Assessment stage"
                  : event.toStatus === "INTERVIEW"
                    ? "Interview stage"
                    : event.toStatus === "WAITLISTED"
                      ? "Waitlisted"
                      : event.toStatus === "OFFERED"
                        ? "Offer stage"
                        : event.toStatus === "HIRED"
                          ? "Placement confirmed"
                          : "Application status updated",
    }));
}

/** Untrusted persisted URLs may never render non-HTTPS, credentialed links. */
export function safeLearnerCompanyWebsite(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl || rawUrl.length > 2048 || /\s/.test(rawUrl)) return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.search ||
      url.hash
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function learnerCompanyPreview(input: {
  companyName: string;
  companyStatus: string;
  websiteUrl: string | null;
  roleTitle: string;
  driveTitle: string;
}) {
  return {
    companyName: input.companyName,
    companyStatus: input.companyStatus,
    websiteUrl: safeLearnerCompanyWebsite(input.websiteUrl),
    roleTitle: input.roleTitle,
    driveTitle: input.driveTitle,
    // The registered company source has no employer biography, employee count
    // or public logo URL; none of those fields may be inferred.
    hasCompanyDescription: false as const,
  };
}

/** Legacy application details showed the employer's named round and its
 * recorded due date when known. Do not invent a deadline for undated rounds. */
export function learnerApplicationRoundDueCopy(
 input:{roundName:string|null;dueAt:Date|string|null},
):{roundName:string|null;dueDate:string|null}{
 const name=input.roundName?.trim()||null;
 if(input.dueAt===null)return {roundName:name,dueDate:null};
 const date=input.dueAt instanceof Date?input.dueAt:new Date(input.dueAt);
 if(!Number.isFinite(date.getTime()))return {roundName:name,dueDate:null};
 return {roundName:name,dueDate:new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
 }).format(date)};
}

/** Legacy status copy is driven by the last committed status transition
 * rather than the offer's independent accepted/declined/issued state. */
export function legacyApplicationDisplayStatus(input:{
 currentStatus:string;
 history:readonly ApplicationStatusEvent[];
}):string{
 const timeline=[...input.history].sort((a,b)=>
  a.occurredAt.getTime()-b.occurredAt.getTime()||a.id.localeCompare(b.id));
 const latest=timeline.at(-1);
 if(input.currentStatus==="REJECTED")
  return learnerApplicationRejectionLabel(latest?.toStatus==="REJECTED"
   ? latest.fromStatus : latest?.toStatus??null);
 const labels:Readonly<Record<string,string>>={
  APPLIED:"Applied",SUBMITTED:"Applied",SHORTLISTED:"Shortlisted",
  ASSESSMENT:"Assessment",INTERVIEW:"Interview",WAITLISTED:"Waitlisted",
  OFFERED:"Offered",HIRED:"Placed",WITHDRAWN:"Withdrawn",
 };
 return labels[input.currentStatus]??"Application status updated";
}


/** One canonical timeline from the independent vNext application, college
 * stage, interview round, offer, and joining histories. A numeric source
 * key must be crosswalked before entry; every row is from the same authorized
 * application and college. Stable (instant, source priority, UUID) order
 * prevents duplicate views while preserving immutable evidence. */
export type PlacementApplicationTimelineSource=
  "APPLICATION"|"COLLEGE_STAGE"|"ROUND"|"OFFER"|"JOINING";
export type PlacementApplicationTimelineEvent={
 id:string;applicationId:string;collegeId:string;
 source:PlacementApplicationTimelineSource;
 label:string;status:string;occurredAt:Date;
 originalEventKey?:string|null;
};
export function unifiedLegacyApplicationTimeline(input:{
 applicationId:string;collegeId:string;
 events:readonly PlacementApplicationTimelineEvent[];
}){
 const priority:Record<PlacementApplicationTimelineSource,number>={
  APPLICATION:0,COLLEGE_STAGE:1,ROUND:2,OFFER:3,JOINING:4,
 };
 const eventKeys=new Set<string>();
 const all=input.events.map(event=>{
  if(event.applicationId!==input.applicationId||
    event.collegeId!==input.collegeId||
    !Number.isFinite(event.occurredAt.getTime()))
   throw new Error("Imported pipeline event has invalid application scope");
  const key=event.source+":"+(event.originalEventKey??event.id);
  if(eventKeys.has(key))throw new Error("Duplicate imported pipeline event");
  eventKeys.add(key);
  return {...event,label:event.status==="REJECTED"
    ?learnerApplicationRejectionLabel(
       input.events.filter(row=>row.source==="COLLEGE_STAGE"&&
        row.occurredAt<event.occurredAt)
        .sort((a,b)=>b.occurredAt.getTime()-a.occurredAt.getTime())[0]?.status??null)
    :event.label};
 });
 return all.sort((a,b)=>a.occurredAt.getTime()-b.occurredAt.getTime()||
  priority[a.source]-priority[b.source]||a.id.localeCompare(b.id));
}
