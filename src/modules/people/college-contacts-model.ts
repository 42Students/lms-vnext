import { z } from "zod";
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
  sort:z.enum(["NAME","NAME_DESC","NEWEST","OLDEST"]).default("NAME"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  pageSize:z.coerce.number().int().refine(n=>[10,25,50].includes(n)).default(COLLEGE_CONTACTS_PAGE_SIZE),
});
export type CollegeContactsQuery=z.infer<typeof collegeContactsQuerySchema>;
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
 if(filter.joinedFrom)params.set("joinedFrom",filter.joinedFrom);
 if(filter.joinedThrough)params.set("joinedThrough",filter.joinedThrough);
 if(filter.status!=="ACTIVE")params.set("status",filter.status);
 if(filter.accountStatus!=="ALL")params.set("accountStatus",filter.accountStatus);
 if(filter.audience!=="ALL")params.set("audience",filter.audience);
 if(filter.profile!=="ALL")params.set("profile",filter.profile);
 if(filter.sort!=="NAME")params.set("sort",filter.sort);
 if(filter.page!==1)params.set("page",String(filter.page));
 if(filter.pageSize!==COLLEGE_CONTACTS_PAGE_SIZE)params.set("pageSize",String(filter.pageSize));
 return "/college/contacts"+(params.size?"?"+params.toString():"");
}
export function parseCollegeContactsSearchParams(raw:Record<string,string|string[]|undefined>){
 const normalized:Record<string,string>={};
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))throw new Error("INVALID_CONTACT_FILTERS");
  if(value!==undefined&&value!=="")normalized[key]=value;
 }
 const filter=collegeContactsQuerySchema.parse(normalized);
 if(!contactDateWindowValid(filter))throw new Error("INVALID_CONTACT_DATE_WINDOW");
 return filter;
}
