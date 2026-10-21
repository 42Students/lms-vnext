import { z } from "zod";

export const COLLEGE_STRUCTURE_PAGE_SIZE = 25;
/** Legacy Super Admin class list paginates 20 rows, other directories may still choose 10/25/50/100. */
// Academic directory URL controls must accept decimal integers only.
// Coercion permits exponents, hexadecimal, and whitespace in forged filters.
const urlDecimalInt = (min: number, max: number) => z.union([
  z.number(),
  z.string().regex(/^[0-9]+$/).transform(Number),
]).pipe(z.number().int().min(min).max(max));
export type CollegeStructureKind = "CLASSES" | "ELECTIVES";

export const collegeStructureQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  page: urlDecimalInt(1,100000).default(1),
  pageSize: urlDecimalInt(10,100).refine(n => [10,20,25,50,100].includes(n)).default(COLLEGE_STRUCTURE_PAGE_SIZE),
}).strict();
export type CollegeStructureQuery = z.infer<typeof collegeStructureQuerySchema>;
export const collegeClassBaseQuerySchema = collegeStructureQuerySchema.extend({
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ALL"),
  departmentCode: z.string().trim().min(1).max(64).optional(),
  periodEndsOnOrBefore: z.iso.date().optional(),
  periodStartsOnOrAfter: z.iso.date().optional(),
  deliveryPresence: z.enum(["ALL","HAS_DELIVERIES","NO_DELIVERIES"]).default("ALL"),
  facultyCoverage: z.enum(["ALL","HAS_FACULTY","NO_FACULTY"]).default("ALL"),
  schedulePresence: z.enum(["ALL","HAS_EVENTS","NO_EVENTS"]).default("ALL"),
  cohortName: z.string().trim().min(1).max(255).optional(),
  className: z.string().trim().min(1).max(255).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  periodLifecycle: z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  cohortStatus: z.enum(["ALL","PLANNED","ACTIVE","COMPLETED","ARCHIVED"]).optional(),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  cohortCode: z.string().trim().min(1).max(64).optional(),
  classCode: z.string().trim().min(1).max(64).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),

  capacityState: z.enum(["ALL","CONFIGURED","UNSET"]).default("ALL"),
  minimumCapacity: urlDecimalInt(1,100000).optional(),
  maximumCapacity: urlDecimalInt(1,100000).optional(),
});

export function withCollegeClassCapacityCheck<T extends z.ZodType<{minimumCapacity?:number;maximumCapacity?:number;capacityState:"ALL"|"CONFIGURED"|"UNSET";periodStartsOnOrAfter?:string;periodEndsOnOrBefore?:string}>>(schema:T){
  return schema.refine(q=>q.minimumCapacity===undefined||q.maximumCapacity===undefined||q.minimumCapacity<=q.maximumCapacity,
    {path:["maximumCapacity"],message:"Maximum class capacity must not be below minimum"})
    .refine(q=>q.capacityState!=="UNSET"||(q.minimumCapacity===undefined&&q.maximumCapacity===undefined),
      {path:["capacityState"],message:"Unconfigured class capacity cannot be combined with numeric capacity bounds"})
    .refine(q=>q.periodStartsOnOrAfter===undefined||q.periodEndsOnOrBefore===undefined||q.periodStartsOnOrAfter<=q.periodEndsOnOrBefore,
      {path:["periodEndsOnOrBefore"],message:"Class period end limit cannot precede start limit"});
}
export const collegeClassQuerySchema=withCollegeClassCapacityCheck(collegeClassBaseQuerySchema);
export type CollegeClassQuery = z.infer<typeof collegeClassQuerySchema>;
export const collegeElectiveBaseQuerySchema = collegeStructureQuerySchema.extend({
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  periodEndsOnOrBefore: z.iso.date().optional(),
  periodStartsOnOrAfter: z.iso.date().optional(),
  descriptionPresence: z.enum(["ALL","RECORDED","MISSING"]).default("ALL"),
  periodLifecycle: z.enum(["ALL","PLANNED","ACTIVE","CLOSED"]).default("ALL"),
  semesterThrough: urlDecimalInt(1,24).optional(),
  semesterFrom: urlDecimalInt(1,24).optional(),
  maximumAllowedPicks: urlDecimalInt(1,1000).optional(),
  minimumRequiredPicks: urlDecimalInt(0,1000).optional(),
  departmentCode: z.string().trim().min(1).max(64).optional(),
  programCode: z.string().trim().min(1).max(64).optional(),
  slotName: z.string().trim().min(1).max(150).optional(),
  periodState: z.enum(["ALL","LINKED","UNLINKED"]).optional(),
  choiceMode: z.enum(["ALL","FLEXIBLE","FIXED"]).optional(),
  offeringState: z.enum(["ALL","HAS_ACTIVE","NONE_ACTIVE"]).optional(),
  academicYearState: z.enum(["ALL","RECORDED","MISSING"]).optional(),
  periodCode: z.string().trim().min(1).max(64).optional(),
  semesterNumber: urlDecimalInt(1,24).optional(),
  programStatus: z.enum(["ALL","ACTIVE","ARCHIVED"]).optional(),
  minimumCredits: urlDecimalInt(1,500).optional(),
  maximumCredits: urlDecimalInt(1,500).optional(),
});

export function withCollegeElectiveCreditsCheck<T extends z.ZodType<{
 minimumCredits?:number;maximumCredits?:number;semesterFrom?:number;semesterThrough?:number;minimumRequiredPicks?:number;maximumAllowedPicks?:number;periodStartsOnOrAfter?:string;periodEndsOnOrBefore?:string;semesterNumber?:number;periodState?:"ALL"|"LINKED"|"UNLINKED";periodCode?:string;periodLifecycle?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED";
}>>(schema:T){
 return schema.refine(q=>q.minimumCredits===undefined||q.maximumCredits===undefined||q.minimumCredits<=q.maximumCredits,
  {path:["maximumCredits"],message:"Maximum elective credits must not be below minimum"})
 .refine(q=>q.semesterFrom===undefined||q.semesterThrough===undefined||q.semesterFrom<=q.semesterThrough,
  {path:["semesterThrough"],message:"Last semester must not precede first semester"})
 .refine(q=>q.minimumRequiredPicks===undefined||q.maximumAllowedPicks===undefined||q.minimumRequiredPicks<=q.maximumAllowedPicks,
  {path:["maximumAllowedPicks"],message:"Maximum allowed choices cannot be below minimum required choices"})
 .refine(q=>q.periodStartsOnOrAfter===undefined||q.periodEndsOnOrBefore===undefined||q.periodStartsOnOrAfter<=q.periodEndsOnOrBefore,
  {path:["periodEndsOnOrBefore"],message:"Linked period end limit cannot precede its start limit"})
 .refine(q=>q.semesterNumber===undefined||((q.semesterFrom===undefined||q.semesterNumber>=q.semesterFrom)&&(q.semesterThrough===undefined||q.semesterNumber<=q.semesterThrough)),
  {path:["semesterNumber"],message:"Exact semester must fall within the selected semester interval"})
 .refine(q=>q.periodState!=="UNLINKED"||(q.periodCode===undefined&&(q.periodLifecycle===undefined||q.periodLifecycle==="ALL")&&q.periodStartsOnOrAfter===undefined&&q.periodEndsOnOrBefore===undefined),
  {path:["periodState"],message:"Unlinked electives cannot be filtered by a linked academic period"});
}
export const collegeElectiveQuerySchema = withCollegeElectiveCreditsCheck(collegeElectiveBaseQuerySchema);
export type CollegeElectiveQuery = z.infer<typeof collegeElectiveQuerySchema>;

/** Preserve the entire URL query for the page-specific strict Zod schema.
 * Silently dropping unknown keys makes a forged bookmark appear to apply
 * filters it never applied, and can unintentionally broaden an export/list.
 * Empty optional selectors are omitted for HTML form compatibility. */
const optionalEmptyStructureKeys = new Set([
  "programCode", "className", "cohortName", "periodStartsOnOrAfter",
  "periodEndsOnOrBefore", "departmentCode", "slotName",
  "minimumRequiredPicks", "maximumAllowedPicks", "semesterFrom",
  "semesterThrough", "programId", "cohortCode", "classCode",
  "periodCode", "minimumCapacity", "maximumCapacity", "semesterNumber",
  "minimumCredits", "maximumCredits",
]);

export function readCollegeStructureParams(
  values: Record<string, string | string[] | undefined>,
): Record<string, string> | null {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) return null;
    if (value === undefined) continue;
    if (typeof value !== "string") return null;
    if (value === "" && optionalEmptyStructureKeys.has(key)) continue;
    result[key] = value;
  }
  return result;
}

export function collegeStructureHref(kind: CollegeStructureKind, query: CollegeStructureQuery | CollegeClassQuery | CollegeElectiveQuery) {
  const path = kind === "CLASSES" ? "/college/classes" : "/college/electives";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.programId) params.set("programId", query.programId);
  if (query.status !== (kind === "CLASSES" ? "ALL" : "ACTIVE")) params.set("status", query.status);
  if (kind === "CLASSES" && "cohortCode" in query && query.cohortCode)
    params.set("cohortCode",query.cohortCode);
  if (kind === "CLASSES" && "capacityState" in query && query.capacityState !== "ALL")
    params.set("capacityState",query.capacityState);
  if (kind === "CLASSES" && "minimumCapacity" in query && query.minimumCapacity !== undefined)
    params.set("minimumCapacity", String(query.minimumCapacity));
  if (kind === "CLASSES" && "maximumCapacity" in query && query.maximumCapacity !== undefined)
    params.set("maximumCapacity",String(query.maximumCapacity));
  if (kind === "ELECTIVES" && "semesterNumber" in query && query.semesterNumber !== undefined)
    params.set("semesterNumber", String(query.semesterNumber));
  if (kind === "ELECTIVES" && "minimumCredits" in query && query.minimumCredits !== undefined)
    params.set("minimumCredits",String(query.minimumCredits));
  if (kind === "ELECTIVES" && "maximumCredits" in query && query.maximumCredits !== undefined)
    params.set("maximumCredits",String(query.maximumCredits));
  if ("cohortStatus" in query && query.cohortStatus && query.cohortStatus !== "ALL") params.set("cohortStatus",query.cohortStatus);
  if ("programStatus" in query && query.programStatus && query.programStatus !== "ALL") params.set("programStatus",query.programStatus);
  if ("periodState" in query && query.periodState && query.periodState !== "ALL") params.set("periodState",query.periodState);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if ("classCode" in query && query.classCode) params.set("classCode",query.classCode);
  if ("choiceMode" in query && query.choiceMode && query.choiceMode !== "ALL") params.set("choiceMode",query.choiceMode);
  if ("offeringState" in query && query.offeringState && query.offeringState !== "ALL") params.set("offeringState",query.offeringState);
  if ("academicYearState" in query && query.academicYearState && query.academicYearState !== "ALL") params.set("academicYearState",query.academicYearState);
  if ("periodCode" in query && query.periodCode) params.set("periodCode",query.periodCode);
  if (kind === "CLASSES" && "periodLifecycle" in query && query.periodLifecycle !== "ALL") params.set("periodLifecycle",query.periodLifecycle);
  if (kind === "CLASSES" && "programCode" in query && query.programCode) params.set("programCode",query.programCode);
  if (kind === "CLASSES" && "className" in query && query.className) params.set("className",query.className);
  if (kind === "CLASSES" && "cohortName" in query && query.cohortName) params.set("cohortName",query.cohortName);
  if (kind === "CLASSES" && "schedulePresence" in query && query.schedulePresence !== "ALL") params.set("schedulePresence",query.schedulePresence);
  if (kind === "CLASSES" && "facultyCoverage" in query && query.facultyCoverage !== "ALL") params.set("facultyCoverage",query.facultyCoverage);
  if (kind === "CLASSES" && "deliveryPresence" in query && query.deliveryPresence !== "ALL") params.set("deliveryPresence",query.deliveryPresence);
  if (kind === "CLASSES" && "periodStartsOnOrAfter" in query && query.periodStartsOnOrAfter) params.set("periodStartsOnOrAfter",query.periodStartsOnOrAfter);
  if (kind === "CLASSES" && "periodEndsOnOrBefore" in query && query.periodEndsOnOrBefore) params.set("periodEndsOnOrBefore",query.periodEndsOnOrBefore);
  if (kind === "CLASSES" && "departmentCode" in query && query.departmentCode) params.set("departmentCode",query.departmentCode);
  if (kind === "ELECTIVES" && "slotName" in query && query.slotName) params.set("slotName", query.slotName);
  if (kind === "ELECTIVES" && "programCode" in query && query.programCode) params.set("programCode", query.programCode);
  if (kind === "ELECTIVES" && "departmentCode" in query && query.departmentCode) params.set("departmentCode", query.departmentCode);
  if (kind === "ELECTIVES" && "minimumRequiredPicks" in query && query.minimumRequiredPicks !== undefined) params.set("minimumRequiredPicks", String(query.minimumRequiredPicks));
  if (kind === "ELECTIVES" && "maximumAllowedPicks" in query && query.maximumAllowedPicks !== undefined) params.set("maximumAllowedPicks", String(query.maximumAllowedPicks));
  if (kind === "ELECTIVES" && "semesterFrom" in query && query.semesterFrom !== undefined) params.set("semesterFrom", String(query.semesterFrom));
  if (kind === "ELECTIVES" && "semesterThrough" in query && query.semesterThrough !== undefined) params.set("semesterThrough", String(query.semesterThrough));
  if (kind === "ELECTIVES" && "periodLifecycle" in query && query.periodLifecycle !== "ALL") params.set("periodLifecycle", query.periodLifecycle);
  if (kind === "ELECTIVES" && "descriptionPresence" in query && query.descriptionPresence !== "ALL") params.set("descriptionPresence", query.descriptionPresence);
  if (kind === "ELECTIVES" && "periodStartsOnOrAfter" in query && query.periodStartsOnOrAfter) params.set("periodStartsOnOrAfter",query.periodStartsOnOrAfter);
  if (kind === "ELECTIVES" && "periodEndsOnOrBefore" in query && query.periodEndsOnOrBefore) params.set("periodEndsOnOrBefore",query.periodEndsOnOrBefore);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== COLLEGE_STRUCTURE_PAGE_SIZE) params.set("pageSize", String(query.pageSize));
  return params.size ? path + "?" + params.toString() : path;
}

export function collegeStructureTotalPages(total: number, pageSize = COLLEGE_STRUCTURE_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function classCapacityLabel(capacity: number | null) {
  return capacity === 0 ? "No limit" : capacity === null ? "Not configured" : String(capacity);
}

export function electiveSelectionLabel(minPick: number, maxPick: number) {
  return minPick === maxPick
    ? `Select ${minPick}`
    : `Select ${minPick}–${maxPick}`;
}
