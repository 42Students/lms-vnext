import { z } from "zod";
import { LEARNING_PATH_STATUSES } from "./constants";

export const COLLEGE_CONTENT_PAGE_SIZE = 25;
export const collegeContentKindSchema = z.enum(["VIDEO", "RESOURCE", "LIVE_CLASS"]);
export type CollegeContentKind = z.infer<typeof collegeContentKindSchema>;

export const collegeContentQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  courseCode: z.string().trim().max(64).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  cohortCode:z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  departmentName: z.string().trim().min(1).max(255).optional(),
  offeringType: z.enum(["ALL","CORE","ELECTIVE"]).optional(),
  lessonStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  pathStatus: z.enum(["ALL",...LEARNING_PATH_STATUSES]).optional(),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"]).default("ALL"),
  format: z.enum(["ALL", "VIDEO", "YOUTUBE"]).default("ALL"),
  scope: z.enum(["ALL","SHARED","SECTION"]).default("ALL"),
  deliveryId:z.string().uuid().optional(),
  visibility: z.enum(["ALL","VISIBLE","HIDDEN"]).default("ALL"),
  offeringStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  page:z.coerce.number().int().min(1).max(1000).default(1),
  // Legacy Video tables start at 10/page; Resource uses 15/page.
  pageSize:z.coerce.number().int().min(10).max(100).optional(),
}).strict();
export type CollegeContentQuery = z.infer<typeof collegeContentQuerySchema>;

export function collegeContentTypes(kind: CollegeContentKind) {
  return kind === "VIDEO" ? ["VIDEO", "YOUTUBE"] as const
    : kind === "LIVE_CLASS" ? ["LIVE_CLASS"] as const : ["RESOURCE"] as const;
}

export function collegeContentHref(kind: CollegeContentKind, query: CollegeContentQuery) {
  const base = kind === "VIDEO" ? "/college/videos" : kind === "LIVE_CLASS"
    ? "/college/live-classes" : "/college/resources";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.courseCode) params.set("courseCode", query.courseCode);
  if (kind !== "LIVE_CLASS" && query.programCode) params.set("programCode",query.programCode);
  if(kind!=="LIVE_CLASS"&&query.cohortCode)params.set("cohortCode",query.cohortCode);
  if(kind!=="LIVE_CLASS"&&query.periodCode)params.set("periodCode",query.periodCode);
  if(kind!=="LIVE_CLASS"&&query.departmentName)params.set("departmentName",query.departmentName);
  if(kind!=="LIVE_CLASS"&&query.offeringType&&query.offeringType!=="ALL")params.set("offeringType",query.offeringType);
  if(kind!=="LIVE_CLASS"&&query.lessonStatus&&query.lessonStatus!=="ALL")params.set("lessonStatus",query.lessonStatus);
  if(kind!=="LIVE_CLASS"&&query.pathStatus&&query.pathStatus!=="ALL")params.set("pathStatus",query.pathStatus);
  if (query.status !== "ALL") params.set("status", query.status);
  if (kind === "VIDEO" && query.format !== "ALL") params.set("format", query.format);
  if (kind !== "LIVE_CLASS" && query.scope !== "ALL") params.set("scope",query.scope);
  if(query.deliveryId)params.set("deliveryId",query.deliveryId);
  if (kind !== "LIVE_CLASS" && query.visibility !== "ALL") params.set("visibility",query.visibility);
  if (kind !== "LIVE_CLASS" && query.offeringStatus && query.offeringStatus !== "ALL")
    params.set("offeringStatus",query.offeringStatus);
  if (query.pageSize) params.set("pageSize",String(query.pageSize));
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? base + "?" + params.toString() : base;
}

export function collegeContentScopeLabel(deliveryId: string | null) {
  return deliveryId ? "Section-specific" : "Shared offering";
}

export function collegeContentDuration(seconds: number | null) {
  if (seconds === null) return "Not recorded";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function collegeContentPageCount(total: number,pageSize=COLLEGE_CONTENT_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function collegeContentSearchParams(
  params: Record<string, string | string[] | undefined>,
) {
  const raw: Record<string, string> = {};
  for (const key of ["q", "courseCode", "programCode", "cohortCode", "periodCode", "pathStatus", "departmentName", "offeringType", "lessonStatus", "status", "format", "scope", "deliveryId", "visibility", "offeringStatus", "page", "pageSize"] as const) {
    const value = params[key];
    if (typeof value === "string") raw[key] = value;
    else if (value !== undefined) return null;
  }
  return raw;
}
