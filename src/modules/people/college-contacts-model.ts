import { z } from "zod";
export const COLLEGE_CONTACTS_PAGE_SIZE=25;
export const collegeContactsQuerySchema=z.strictObject({
  tab:z.enum(["ALL","FACULTY","STUDENT"]).default("ALL"),
  q:z.string().trim().max(100).default(""),
  status:z.enum(["ALL","ACTIVE","SUSPENDED","ENDED"]).default("ACTIVE"),
  sort:z.enum(["NAME","NEWEST"]).default("NAME"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
});
export type CollegeContactsQuery=z.infer<typeof collegeContactsQuerySchema>;
export function collegeContactsHref(filter:CollegeContactsQuery):string{
 const params=new URLSearchParams();
 if(filter.tab!=="ALL")params.set("tab",filter.tab);
 if(filter.q)params.set("q",filter.q);
 if(filter.status!=="ACTIVE")params.set("status",filter.status);
 if(filter.sort!=="NAME")params.set("sort",filter.sort);
 if(filter.page!==1)params.set("page",String(filter.page));
 return "/college/contacts"+(params.size?"?"+params.toString():"");
}
export function parseCollegeContactsSearchParams(raw:Record<string,string|string[]|undefined>){
 const normalized:Record<string,string>={};
 for(const [key,value] of Object.entries(raw)){
  if(Array.isArray(value))throw new Error("INVALID_CONTACT_FILTERS");
  if(value!==undefined&&value!=="")normalized[key]=value;
 }
 return collegeContactsQuerySchema.parse(normalized);
}
