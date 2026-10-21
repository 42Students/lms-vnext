import { z } from "zod";
import {COURSE_TEACHING_ROLES} from "@/modules/courses/constants";
export const COLLEGE_CONTACTS_PAGE_SIZE=10;
// URL pagination must be decimal digits; z.coerce.number also accepts
// hexadecimal, exponent notation and whitespace supplied by a forged URL.
const decimalContactInteger = (min: number, max: number) => z.union([
  z.number().int().min(min).max(max),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(min).max(max)),
]);
export const collegeContactsQuerySchema=z.strictObject({
  tab:z.enum(["ALL","FACULTY","STUDENT"]).default("ALL"),
  q:z.string().trim().max(100).default(""),
  initial:z.string().regex(/^[A-Z]$/).optional(),
  membershipId:z.string().uuid().optional(),
  joinedFrom:z.iso.date().optional(),
  joinedThrough:z.iso.date().optional(),
  status:z.enum(["ALL","ACTIVE","SUSPENDED","ENDED"]).default("ACTIVE"),
  accountStatus:z.enum(["ALL","ACTIVE","DISABLED"]).default("ALL"),
  audience:z.enum(["ALL","FACULTY_ONLY","LEARNER_ONLY","DUAL"]).default("ALL"),
  profile:z.enum(["ALL","PROFILED","UNPROFILED"]).default("ALL"),
  cohortId:z.string().uuid().optional(),
  programId:z.string().uuid().optional(),
  sectionId:z.string().uuid().optional(),
  facultyDepartmentId:z.string().uuid().optional(),
  employmentType:z.string().trim().min(1).max(128).optional(),
  facultyTitleQ:z.string().trim().min(1).max(80).optional(),
  classPresence:z.enum(["ALL","ASSIGNED","NONE"]).default("ALL"),
  departmentPresence:z.enum(["ALL","ASSIGNED","MISSING"]).default("ALL"),
  titlePresence:z.enum(["ALL","PRESENT","MISSING"]).default("ALL"),
  registrationPresence:z.enum(["ALL","PRESENT","MISSING"]).default("ALL"),
  rollPresence:z.enum(["ALL","PRESENT","MISSING"]).default("ALL"),
  teaching:z.enum(["ALL","ASSIGNED","NONE"]).default("ALL"),
  teachingRole:z.union([z.literal("ALL"),z.enum(COURSE_TEACHING_ROLES)]).default("ALL"),
  enrollment:z.enum(["ALL","ACTIVE","NONE"]).default("ALL"),
  sort:z.enum(["NAME","NAME_DESC","NEWEST","OLDEST"]).default("NAME"),
  page:decimalContactInteger(1,10000).default(1),
  pageSize:decimalContactInteger(10,50).refine(n=>[10,20,25,50].includes(n)).default(COLLEGE_CONTACTS_PAGE_SIZE),
});
export type CollegeContactsQuery=z.infer<typeof collegeContactsQuerySchema>;
export function contactRoleAudienceCompatible(filter:{tab:string;audience:string}):boolean {
 return !(filter.tab==="STUDENT"&&filter.audience==="FACULTY_ONLY")&&
  !(filter.tab==="FACULTY"&&filter.audience==="LEARNER_ONLY");
}
export function contactAcademicFiltersCompatible(filter:{teaching:string;teachingRole:string;enrollment:string;cohortId?:string;programId?:string;sectionId?:string;classPresence:string}):boolean {
 if(filter.enrollment==="NONE"&&(filter.cohortId||filter.programId||filter.sectionId||filter.classPresence==="ASSIGNED"))return false;
 if(filter.classPresence==="NONE"&&filter.sectionId)return false;
 return !(filter.teaching==="NONE"&&filter.teachingRole!=="ALL");
}
export function contactDateWindowValid(filter:{joinedFrom?:string;joinedThrough?:string}):boolean {
 return !(filter.joinedFrom&&filter.joinedThrough&&filter.joinedFrom>filter.joinedThrough);
}
export function contactsIstDayStart(day:string):Date {
 return new Date(day+"T00:00:00+05:30");
}
export function contactsNextIstDayStart(day:string):Date {
 return new Date(contactsIstDayStart(day).getTime()+86400000);
}
export function collegeContactsHref(filter:CollegeContactsQuery):string{
 const params=new URLSearchParams();
 if(filter.tab!=="ALL")params.set("tab",filter.tab);
 if(filter.q)params.set("q",filter.q);
 if(filter.initial)params.set("initial",filter.initial);
 if(filter.membershipId)params.set("membershipId",filter.membershipId);
 if(filter.joinedFrom)params.set("joinedFrom",filter.joinedFrom);
 if(filter.joinedThrough)params.set("joinedThrough",filter.joinedThrough);
 if(filter.status!=="ACTIVE")params.set("status",filter.status);
 if(filter.accountStatus!=="ALL")params.set("accountStatus",filter.accountStatus);
 if(filter.audience!=="ALL")params.set("audience",filter.audience);
 if(filter.profile!=="ALL")params.set("profile",filter.profile);
 if(filter.cohortId)params.set("cohortId",filter.cohortId);
 if(filter.programId)params.set("programId",filter.programId);
 if(filter.sectionId)params.set("sectionId",filter.sectionId);
 if(filter.facultyDepartmentId)params.set("facultyDepartmentId",filter.facultyDepartmentId);
 if(filter.employmentType)params.set("employmentType",filter.employmentType);
 if(filter.facultyTitleQ)params.set("facultyTitleQ",filter.facultyTitleQ);
 if(filter.classPresence!=="ALL")params.set("classPresence",filter.classPresence);
 if(filter.departmentPresence!=="ALL")params.set("departmentPresence",filter.departmentPresence);
 if(filter.titlePresence!=="ALL")params.set("titlePresence",filter.titlePresence);
 if(filter.registrationPresence!=="ALL")params.set("registrationPresence",filter.registrationPresence);
 if(filter.rollPresence!=="ALL")params.set("rollPresence",filter.rollPresence);
 if(filter.teaching!=="ALL")params.set("teaching",filter.teaching);
 if(filter.teachingRole!=="ALL")params.set("teachingRole",filter.teachingRole);
 if(filter.enrollment!=="ALL")params.set("enrollment",filter.enrollment);
 if(filter.sort!=="NAME")params.set("sort",filter.sort);
 if(filter.page!==1)params.set("page",String(filter.page));
 if(filter.pageSize!==COLLEGE_CONTACTS_PAGE_SIZE)params.set("pageSize",String(filter.pageSize));
 return "/college/contacts"+(params.size?"?"+params.toString():"");
}
/** Reset every query facet, retaining only the intentionally selected contact tab. */
export function clearedCollegeContactsHref(tab:CollegeContactsQuery["tab"]):string{
 return collegeContactsHref(collegeContactsQuerySchema.parse({tab}));
}
export function parseCollegeContactsSearchParams(raw:Record<string,string|string[]|undefined>){
 const entries:[string,string][]=[];
 const legacyView=raw.view;
 const legacyTab=raw.tab;
 for(const [key,value] of Object.entries(raw)){
  if(key==="view"||key==="pageNumber")continue;
  if(Array.isArray(value))throw new Error("INVALID_CONTACT_FILTERS");
  if(value!==undefined&&value!=="")entries.push([key,value]);
 }
 const normalized:Record<string,string>=Object.fromEntries(entries);
 // Only legacy view supports repeated values, taking the first as the old
 // router did. Explicit tab takes priority and remains strictly validated.
 if(legacyTab===undefined&&legacyView!==undefined){
  const value=Array.isArray(legacyView)?legacyView[0]:legacyView;
  const lowered=(value??"").toLowerCase();
  normalized.tab=lowered==="faculty"?"FACULTY":
   lowered==="students"||lowered==="student"||lowered==="learner"?"STUDENT":"ALL";
 }
 const legacyPage=raw.pageNumber;
 if(legacyPage!==undefined&&!Array.isArray(legacyPage)&&raw.page===undefined&&/^-?\d+$/.test(legacyPage))
  normalized.page=String(Math.max(1,Number(legacyPage)+1));
 if(normalized.page!==undefined&&/^-?\d+$/.test(normalized.page))
  normalized.page=String(Math.max(1,Number(normalized.page)));
 if(normalized.pageSize!==undefined&&/^-?\d+$/.test(normalized.pageSize)&&Number(normalized.pageSize)<=0)
  normalized.pageSize=String(COLLEGE_CONTACTS_PAGE_SIZE);
 const filter=collegeContactsQuerySchema.parse(normalized);
 if(!contactDateWindowValid(filter))throw new Error("INVALID_CONTACT_DATE_WINDOW");
 if(!contactAcademicFiltersCompatible(filter))throw new Error("INVALID_CONTACT_ACADEMIC_COMBINATION");
 if(!contactRoleAudienceCompatible(filter))throw new Error("INVALID_CONTACT_ROLE_AUDIENCE");
 return filter;
}

/** Literal SQL LIKE search, never expose wildcard interpretation to callers. */
export function collegeContactLiteralPattern(value:string):string {
 return "%"+value.replace(/[\\%_]/g,"\\$&")+"%";
}

/** Keep meaningful facets on tab changes, dropping only an impossible audience. */
export function collegeContactsTabHref(filter:CollegeContactsQuery,tab:CollegeContactsQuery["tab"]):string{
 const audience=contactRoleAudienceCompatible({tab,audience:filter.audience})?filter.audience:"ALL";
 return collegeContactsHref({...filter,tab,audience,page:1});
}

/** Exit an exact membership bookmark without erasing meaningful directory filters. */
export function collegeContactsWithoutMemberHref(filter:CollegeContactsQuery):string{
 return collegeContactsHref({...filter,membershipId:undefined,page:1});
}

/** The public error explanation must not echo query values, memberships or internal stack traces. */
export function collegeContactFilterMessage(error:unknown):string {
 if(error instanceof z.ZodError){
  if(error.issues.some(issue=>issue.path[0]==="pageSize"))
   return "Choose 10, 20 or 50 contacts per page (25 remains supported for older saved views). No contacts were loaded.";
  if(error.issues.some(issue=>issue.path[0]==="programId"))
   return "Program ID must be a valid identifier. No contacts were loaded.";
  if(error.issues.some(issue=>issue.path[0]==="facultyDepartmentId"))
   return "Department ID must be a valid identifier. No contacts were loaded.";
 }
 switch(error instanceof Error?error.message:"") {
  case "INVALID_CONTACT_DATE_WINDOW":
   return "Joined start date must be on or before the end date. No contacts were loaded.";
  case "INVALID_CONTACT_ACADEMIC_COMBINATION":
   return "The selected enrollment, class or teaching filters cannot be combined. No contacts were loaded.";
  case "INVALID_CONTACT_ROLE_AUDIENCE":
   return "That contact role audience is incompatible with the selected tab. No contacts were loaded.";
  default:
   return "A contact filter is invalid. No contacts were loaded.";
 }
}

/** Honest first/last ordinal for scoped Contact result pages. */
export function collegeContactsPageRange(page:number,pageSize:number,total:number):{first:number;last:number}{
 if(total<=0)return {first:0,last:0};
 return {first:Math.min(total,(page-1)*pageSize+1),last:Math.min(total,page*pageSize)};
}

/** URL-backed count intentionally excludes pagination, sorting and the selected tab. */
export function activeCollegeContactFilterCount(filter:CollegeContactsQuery):number{
 const params=new URL(collegeContactsHref(filter),"https://college.invalid").searchParams;
 for(const key of ["tab","page","pageSize","sort"])params.delete(key);
 return [...params.keys()].length;
}

/** Page-local only: these counts never pretend to summarize the full college. */
export function collegeContactPageRoleCounts(rows:readonly {roles:readonly ("FACULTY"|"LEARNER")[]}[]){
 let facultyOnly=0,learnerOnly=0,dual=0;
 for(const row of rows){
  if(row.roles.includes("FACULTY")&&row.roles.includes("LEARNER"))dual++;
  else if(row.roles.includes("FACULTY"))facultyOnly++;
  else if(row.roles.includes("LEARNER"))learnerOnly++;
 }
 return {facultyOnly,learnerOnly,dual};
}
