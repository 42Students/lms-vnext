import { z } from "zod";
import {COURSE_TEACHING_ROLES} from "@/modules/courses/constants";
export const COLLEGE_CONTACTS_PAGE_SIZE=25;
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
  page:z.coerce.number().int().min(1).max(10000).default(1),
  pageSize:z.coerce.number().int().refine(n=>[10,25,50].includes(n)).default(COLLEGE_CONTACTS_PAGE_SIZE),
});
export type CollegeContactsQuery=z.infer<typeof collegeContactsQuerySchema>;
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
 const normalized:Record<string,string>={};
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))throw new Error("INVALID_CONTACT_FILTERS");
  if(value!==undefined&&value!=="")normalized[key]=value;
 }
 const filter=collegeContactsQuerySchema.parse(normalized);
 if(!contactDateWindowValid(filter))throw new Error("INVALID_CONTACT_DATE_WINDOW");
 if(!contactAcademicFiltersCompatible(filter))throw new Error("INVALID_CONTACT_ACADEMIC_COMBINATION");
 return filter;
}

/** Literal SQL LIKE search, never expose wildcard interpretation to callers. */
export function collegeContactLiteralPattern(value:string):string {
 return "%"+value.replace(/[\\%_]/g,"\\$&")+"%";
}
