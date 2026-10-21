import { z } from "zod";

// Guard URL numbers before they reach paging SQL; Zod coercion admits
// hex, exponent notation, whitespace and the empty string as integers.
const decimalPage = (min: number, max: number, fallback: number) => z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(min).max(max)),
]).default(fallback);

const schema = z.strictObject({
  view: z.enum(["ALL", "NOT_SUBMITTED"]).default("ALL"),
  q: z.string().trim().max(120).optional(),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  submissionStatus: z.enum([
    "DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "APPROVED",
    "UNDER_REVIEW", "LOCKED", "DRAFT_REVISING",
  ]).optional(),
  page: decimalPage(1,100000,1),
  pageSize: decimalPage(10,100,25),
}).refine(value=>value.view!=="NOT_SUBMITTED"||value.submissionStatus===undefined,{
  path:["submissionStatus"],
  message:"Submission status applies only to the All submissions view",
});
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const legacySubmissionStatus: Record<string,string> = {
  accepted:"APPROVED", approved:"APPROVED", submitted:"SUBMITTED",
  underreview:"UNDER_REVIEW", "under review":"UNDER_REVIEW",
  changesrequested:"CHANGES_REQUESTED", "changes requested":"CHANGES_REQUESTED",
  draft:"DRAFT", "draft(revising)":"DRAFT_REVISING", "draft revising":"DRAFT_REVISING",
  locked:"LOCKED",
};
function normalizeSubmissionStatus(value: string | undefined) {
  if (!value) return value;
  const trimmed=value.trim();
  return legacySubmissionStatus[trimmed.toLowerCase()] ?? trimmed.toUpperCase().replace(/ +/g, "_");
}


export function parseProjectAdminSubmissionsQuery(params: Record<string,string|string[]|undefined>) {
  if (Object.values(params).some(Array.isArray) ||
      Object.keys(params).some(key=>!["view","q","status","submissionStatus","page","pageSize","tab","projectId"].includes(key)))
    return schema.safeParse(null);
  const rawStatus=first(params.status)?.trim();
  const workspaceStatus=rawStatus && ["PLANNED","ACTIVE","COMPLETED","ARCHIVED"].includes(rawStatus.toUpperCase())
    ? rawStatus.toUpperCase() : undefined;
  const legacySubmission=rawStatus && !workspaceStatus ? normalizeSubmissionStatus(rawStatus) : undefined;
  const entries = {
    view:first(params.view)??(first(params.tab)?.toLowerCase()==="notsubmitted"?"NOT_SUBMITTED":"ALL"),
    q:first(params.q)??first(params.projectId),status:workspaceStatus,
    submissionStatus:normalizeSubmissionStatus(first(params.submissionStatus) ?? legacySubmission),
    page:first(params.page),pageSize:first(params.pageSize),
  };
  return schema.safeParse(Object.fromEntries(
    Object.entries(entries).filter(([key,value])=>value!==undefined&&(value!=="" || key==="page" || key==="pageSize")),
  ));
}

/** Keep the same authorized filters when browsing unsubmitted workspaces.
 * This view has a separate bounded workspace query and no submission-status
 * filter; never carry one across as though it were applied. */
export function projectAdminUnsubmittedHref(
  basePath:string,
  query:{q?:string;status?:"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED";pageSize?:number},
  page=1,
):string {
  const params=new URLSearchParams();
  params.set("view","NOT_SUBMITTED");
  if(query.q)params.set("q",query.q);
  if(query.status)params.set("status",query.status);
  if(query.pageSize)params.set("pageSize",String(query.pageSize));
  if(page>1)params.set("page",String(page));
  return basePath+"?"+params.toString();
}

/** Switching back to submitted versions or a review shortcut should retain
 * the search, workspace status and rows preference, while starting at page 1.
 * A submission-status shortcut replaces (never combines with) the old status.
 */
export function projectAdminSubmissionHref(
  basePath:string,
  query:{q?:string;status?:"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED";pageSize?:number},
  submissionStatus?:"SUBMITTED"|"UNDER_REVIEW"|"LOCKED"|"DRAFT_REVISING",
):string {
  const params=new URLSearchParams();
  if(query.q)params.set("q",query.q);
  if(query.status)params.set("status",query.status);
  if(query.pageSize)params.set("pageSize",String(query.pageSize));
  if(submissionStatus)params.set("submissionStatus",submissionStatus);
  const suffix=params.toString();
  return basePath+(suffix?"?"+suffix:"");
}

// The imported deep-link identifier remains scoped by the listing's college.
export function focusedProjectIdFromSubmissionUrl(raw: Record<string, string | string[] | undefined>) {
  const value = first(raw.projectId);
  if (!value || value.length > 120 || /[^a-zA-Z0-9_-]/.test(value)) return null;
  return value;
}
