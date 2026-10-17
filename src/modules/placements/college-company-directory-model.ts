import {z} from "zod";

export const COLLEGE_COMPANIES_PAGE_SIZES=[10,20,50,100] as const;
const Schema=z.strictObject({
  q:z.string().trim().max(100).default(""),
  page:z.coerce.number().int().min(1).max(1000).default(1),
  pageSize:z.coerce.number().int().refine(value=>COLLEGE_COMPANIES_PAGE_SIZES.some(size=>size===value),{
    message:"Choose a supported company page size.",
  }).default(10),
  sort:z.enum(["LAST_ACTIVE","COMPANY","DRIVES"]).default("LAST_ACTIVE"),
  showDeleted:z.enum(["0","1"]).default("0"),
});
export const COLLEGE_COMPANIES_PAGE_SIZE=10;
export type CollegeCompaniesQuery=z.infer<typeof Schema>;

export function parseCollegeCompaniesQuery(raw:Record<string,string|string[]|undefined>) {
  return Schema.safeParse(raw);
}
export function collegeCompaniesHref(query:CollegeCompaniesQuery) {
  const params=new URLSearchParams();
  if(query.q)params.set("q",query.q);
  if(query.pageSize!==10)params.set("pageSize",String(query.pageSize));
  if(query.sort!=="LAST_ACTIVE")params.set("sort",query.sort);
  if(query.showDeleted==="1")params.set("showDeleted","1");
  if(query.page>1)params.set("page",String(query.page));
  return "/college/companies"+(params.size?"?"+params.toString():"");
}
export function literalCompanySearch(value:string) {
  return "%"+value.replace(/[\\%_]/g,"\\$&")+"%";
}
