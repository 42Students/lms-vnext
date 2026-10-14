import { z } from "zod";
export const learnerSupportListQuerySchema = z.object({
  status:z.enum(["ALL","PENDING","APPROVED","REJECTED","CANCELLED"]).optional(),
}).strict();
export type LearnerSupportRequestRow={
  request:{id:string;requestType:string;status:string;reason:string;requestedAt:Date;decisionNote:string|null;},
  job:{title:string;id:string},roleOption:{title:string},company:{name:string}
};
/** Only persisted placement application requests qualify; no generic helpdesk rows are inferred. */
export function ownLearnerSupportRequestList(rows:readonly LearnerSupportRequestRow[],raw:unknown) {
  const parsed=learnerSupportListQuerySchema.parse(raw);
  const status=parsed.status??"ALL";
  const filtered=status==="ALL"?rows:rows.filter(row=>row.request.status===status);
  return {status,items:filtered.slice(0,30),hasMore:filtered.length>30,total:filtered.length};
}
export function placementRequestTypeLabel(value:string) {
  switch(value) {
    case "APPLICATION_WITHDRAWAL":return "Application withdrawal";
    case "ROUND_RESCHEDULE":return "Interview or round reschedule";
    case "OFFER_EXTENSION":return "Offer deadline extension";
    default:return "Placement request";
  }
}