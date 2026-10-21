import { z } from "zod";
import type { MembershipStatus } from "@/modules/identity/constants";
import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";

export const COLLEGE_ROLE_DIRECTORY_PAGE_SIZE = 25;
export const collegeDirectoryKindSchema = z.enum(["FACULTY", "LEARNER"]);
export type CollegeDirectoryKind = z.infer<typeof collegeDirectoryKindSchema>;

export const collegeRoleDirectoryQuerySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "ENDED"]).default("ALL"),
  accountStatus: z.enum(["ALL", "ACTIVE", "DISABLED"]).default("ALL"),
  joinedFrom: z.iso.date().optional(),
  joinedThrough: z.iso.date().optional(),
  enrollment: z.enum(["ALL", "ACTIVE", "NONE"]).default("ALL"),
  rollPresence: z.enum(["ALL", "PRESENT", "MISSING"]).default("ALL"),
  registrationPresence: z.enum(["ALL", "PRESENT", "MISSING"]).default("ALL"),
  cohortId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  classPresence: z.enum(["ALL", "ASSIGNED", "NONE"]).default("ALL"),
  teaching: z.enum(["ALL", "ASSIGNED", "NONE"]).default("ALL"),
  teachingRole: z.union([z.literal("ALL"), z.enum(COURSE_TEACHING_ROLES)]).default("ALL"),
  facultyDepartmentId: z.string().uuid().optional(),
  titlePresence: z.enum(["ALL", "PRESENT", "MISSING"]).default("ALL"),
  departmentPresence: z.enum(["ALL", "ASSIGNED", "MISSING"]).default("ALL"),
  employmentType: z.string().trim().min(1).max(128).optional(),
  sort: z.enum(["NAME", "NAME_DESC", "ROLL", "ROLL_DESC", "NEWEST", "OLDEST"]).default("NAME"),
  // URL paging must not silently interpret hexadecimal, exponent syntax or
  // whitespace as another tenant-directory page.
  page: z.union([
    z.number().int().min(1).max(10000),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(10000)),
  ]).default(1),
  pageSize: z.union([
    z.number().int(),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int()),
  ]).refine(n => [10,25,50,100,200].includes(n)).default(COLLEGE_ROLE_DIRECTORY_PAGE_SIZE),
}).strict();

export type CollegeRoleDirectoryQuery = z.infer<typeof collegeRoleDirectoryQuerySchema>;

export function collegeDirectorySearchHint(kind: CollegeDirectoryKind) {
  return kind === "LEARNER" ? "Name, email, roll, registration, program or batch" : "Name, email, title, employment type or department";
}

export type CollegeRoleDirectoryRow = {
  membershipId: string;
  name: string;
  email: string | null;
  membershipStatus: MembershipStatus;
  userStatus: string;
  joinedAt: Date;
  program: string | null;
  cohort: string | null;
  sections: string[];
  activeTeachingAssignments: number;
  /** College-scoped learner search identifiers, absent for faculty. */
  rollNumber?:string|null;
  registrationNumber?:string|null;
  legacyUniqueId?:string|null;
  department?:string|null;
  employmentType?:string|null;
};

export function describeCollegeDirectoryContext(
  kind: CollegeDirectoryKind,
  row: Pick<CollegeRoleDirectoryRow,
    "program" | "cohort" | "sections" | "activeTeachingAssignments">,
): string {
  if (kind === "FACULTY") {
    return row.activeTeachingAssignments === 1
      ? "1 active course teaching assignment"
      : `${row.activeTeachingAssignments} active course teaching assignments`;
  }
  if (!row.program || !row.cohort) {
    return "No active program/batch enrollment recorded";
  }
  const prefix = `${row.program} · ${row.cohort}`;
  return row.sections.length
    ? prefix + " · " + [...new Set(row.sections)].sort().join(", ")
    : prefix + " · No active class recorded";
}

export function collegeRoleDirectoryHref(
  kind: CollegeDirectoryKind,
  filter: CollegeRoleDirectoryQuery,
): string {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status !== "ALL") params.set("status", filter.status);
  if (filter.accountStatus !== "ALL") params.set("accountStatus", filter.accountStatus);
  if (filter.joinedFrom) params.set("joinedFrom",filter.joinedFrom);
  if (filter.joinedThrough) params.set("joinedThrough",filter.joinedThrough);
  if (kind === "LEARNER" && filter.enrollment !== "ALL") params.set("enrollment", filter.enrollment);
  if (kind === "LEARNER" && filter.rollPresence !== "ALL") params.set("rollPresence", filter.rollPresence);
  if (kind === "LEARNER" && filter.registrationPresence !== "ALL") params.set("registrationPresence", filter.registrationPresence);
  if (kind === "LEARNER" && filter.cohortId) params.set("cohortId",filter.cohortId);
  if (kind === "LEARNER" && filter.programId) params.set("programId",filter.programId);
  if (kind === "LEARNER" && filter.sectionId) params.set("sectionId",filter.sectionId);
  if (kind === "LEARNER" && filter.classPresence !== "ALL") params.set("classPresence", filter.classPresence);
  if (kind === "FACULTY" && filter.teaching !== "ALL") params.set("teaching", filter.teaching);
  if (kind === "FACULTY" && filter.teachingRole !== "ALL") params.set("teachingRole", filter.teachingRole);
  if (kind === "FACULTY" && filter.facultyDepartmentId) params.set("facultyDepartmentId", filter.facultyDepartmentId);
  if (kind === "FACULTY" && filter.titlePresence !== "ALL") params.set("titlePresence", filter.titlePresence);
  if (kind === "FACULTY" && filter.departmentPresence !== "ALL") params.set("departmentPresence", filter.departmentPresence);
  if (kind === "FACULTY" && filter.employmentType) params.set("employmentType",filter.employmentType);
  if (filter.sort !== "NAME") params.set("sort", filter.sort);
  if (filter.page > 1) params.set("page", String(filter.page));
  if (filter.pageSize !== COLLEGE_ROLE_DIRECTORY_PAGE_SIZE) params.set("pageSize", String(filter.pageSize));
  const base = kind === "FACULTY" ? "/college/faculty" : "/college/students";
  return params.size ? base + "?" + params.toString() : base;
}

/** Reject ambiguous or forged directory queries before loading any college people. */
export function parseCollegeRoleDirectorySearchParams(raw: Record<string, string | string[] | undefined>): CollegeRoleDirectoryQuery {
  const entries: [string,string][] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (!Object.hasOwn(collegeRoleDirectoryQuerySchema.shape,key) || Array.isArray(value)) {
      throw new Error("INVALID_ROLE_DIRECTORY_FILTERS");
    }
    if ((key==="page"||key==="pageSize")&&value==="")
      throw new Error("INVALID_ROLE_DIRECTORY_FILTERS");
    if (value !== undefined && value !== "") entries.push([key,value]);
  }
  const filter=collegeRoleDirectoryQuerySchema.parse(Object.fromEntries(entries));
  if (!roleDirectoryDateWindowValid(filter)) throw new Error("INVALID_ROLE_DIRECTORY_DATE_WINDOW");
  return filter;
}

/** Return a stable URL when deletions/filter changes make the requested page stale. */
export function canonicalCollegeRoleDirectoryHref(kind: CollegeDirectoryKind, filter: CollegeRoleDirectoryQuery, totalPages: number): string | null {
  const lastPage = Math.max(1, Math.floor(totalPages));
  return filter.page > lastPage ? collegeRoleDirectoryHref(kind, {...filter, page:lastPage}) : null;
}

/** Preserve a bookmarked filter omitted by a bounded selector without resolving foreign IDs. */
export function selectedDirectoryValueNotListed(value: string | undefined, visibleOptions: readonly string[]): boolean {
  return Boolean(value && !visibleOptions.includes(value));
}

export function roleDirectoryDateWindowValid(window: {joinedFrom?:string;joinedThrough?:string}): boolean {
  return !(window.joinedFrom && window.joinedThrough && window.joinedFrom>window.joinedThrough);
}
/** Inclusive IST calendar day lower bound and exclusive next-day upper bound. */
export function roleDirectoryIstDayStart(day: string): Date {return new Date(day+"T00:00:00+05:30");}
export function roleDirectoryNextIstDayStart(day: string): Date {return new Date(roleDirectoryIstDayStart(day).getTime()+86400000);}

/** Impossible combinations should be rejected, not rendered as a misleading empty college roster. */
export function assertCompatibleCollegeRoleDirectoryFilters(kind: CollegeDirectoryKind, filter: CollegeRoleDirectoryQuery): void {
  // Apply the same role-specific restrictions to the page and CSV as the persisted service.
  if(kind==="FACULTY"){
   if(filter.sectionId)throw new RangeError("FACULTY_SECTION_FILTER_UNSUPPORTED");
   if(filter.programId)throw new RangeError("FACULTY_PROGRAM_FILTER_UNSUPPORTED");
   if(filter.cohortId)throw new RangeError("FACULTY_COHORT_FILTER_UNSUPPORTED");
   if(filter.classPresence!=="ALL")throw new RangeError("FACULTY_CLASS_FILTER_UNSUPPORTED");
   if(filter.registrationPresence!=="ALL")throw new RangeError("FACULTY_REGISTRATION_FILTER_UNSUPPORTED");
   if(filter.rollPresence!=="ALL")throw new RangeError("FACULTY_ROLL_FILTER_UNSUPPORTED");
   if(filter.enrollment!=="ALL")throw new RangeError("FACULTY_ENROLLMENT_FILTER_UNSUPPORTED");
  }else{
   if(filter.teachingRole!=="ALL")throw new RangeError("LEARNER_TEACHING_ROLE_UNSUPPORTED");
   if(filter.teaching!=="ALL")throw new RangeError("LEARNER_TEACHING_FILTER_UNSUPPORTED");
   if(filter.employmentType)throw new RangeError("LEARNER_EMPLOYMENT_FILTER_UNSUPPORTED");
   if(filter.departmentPresence!=="ALL")throw new RangeError("LEARNER_PRIMARY_DEPARTMENT_FILTER_UNSUPPORTED");
   if(filter.titlePresence!=="ALL")throw new RangeError("LEARNER_ACADEMIC_TITLE_FILTER_UNSUPPORTED");
   if(filter.facultyDepartmentId)throw new RangeError("LEARNER_FACULTY_DEPARTMENT_FILTER_UNSUPPORTED");
  }
  if (kind === "FACULTY" && filter.teaching === "NONE" && filter.teachingRole !== "ALL") {
    throw new RangeError("FACULTY_TEACHING_FILTER_CONFLICT");
  }
  if (kind === "LEARNER" && filter.classPresence === "NONE" && filter.sectionId) {
    throw new RangeError("LEARNER_CLASS_FILTER_CONFLICT");
  }
  if (kind === "LEARNER" && filter.enrollment === "NONE" && (filter.cohortId || filter.programId || filter.sectionId || filter.classPresence === "ASSIGNED")) {
    throw new RangeError("LEARNER_ENROLLMENT_FILTER_CONFLICT");
  }
}

/** A direct, masked-contact drilldown for an already-authorized roster row. */
export function collegeRoleContactHref(membershipId:string):string {
  return "/college/contacts/"+z.string().uuid().parse(membershipId);
}

/** Public message categories; raw user values and internal exception details are never displayed. */
export function collegeRoleDirectoryFilterMessage(error:unknown):string{
 const code=error instanceof Error?error.message:"";
 if(code==="INVALID_ROLE_DIRECTORY_DATE_WINDOW")
  return "Joined-from date must be on or before joined-through date. No roster was loaded.";
 if(code==="LEARNER_CLASS_FILTER_CONFLICT"||code==="LEARNER_ENROLLMENT_FILTER_CONFLICT")
  return "The class and enrollment filters cannot be combined. No roster was loaded.";
 if(code==="FACULTY_TEACHING_FILTER_CONFLICT")
  return "A specific teaching role cannot be combined with no active teaching. No roster was loaded.";
 if(code.endsWith("_UNSUPPORTED"))
  return "This filter belongs to the other directory. Clear filters and choose the appropriate tab.";
 return "A directory filter is invalid. No people were loaded.";
}

/** A missing role population and a filtered-zero search are different states. */
export function collegeRoleDirectoryHasActiveFilters(kind:CollegeDirectoryKind,filter:CollegeRoleDirectoryQuery):boolean {
 const base=collegeRoleDirectoryHref(kind,{...filter,page:1,pageSize:COLLEGE_ROLE_DIRECTORY_PAGE_SIZE,sort:"NAME"});
 return new URL(base,"https://college.invalid").searchParams.size>0;
}

export function collegeRoleDirectoryPageRange(page:number,pageSize:number,total:number):{first:number;last:number}{
 if(total<=0)return {first:0,last:0};
 return {first:Math.min(total,(page-1)*pageSize+1),last:Math.min(total,page*pageSize)};
}

/** Approved crosswalk for legacy learner search. Contact details must be
 * separately authorized by the contact drilldown, not dumped in search. */
export function collegeLearnerSearchProjection(row:CollegeRoleDirectoryRow){
 const names=row.name.trim().split(/\s+/);
 return {id:row.membershipId,firstName:names[0]??"",
  lastName:names.slice(1).join(" "),uniqueId:row.legacyUniqueId??null,
  rollNumber:row.rollNumber??null,registrationNumber:row.registrationNumber??null,
  department:row.department??null,program:row.program,college:null,
  class:row.sections.join(", ")||null,
  contactMail:null,contactMobile:null,contactHref:collegeRoleContactHref(row.membershipId)};
}
