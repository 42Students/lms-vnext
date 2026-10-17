import {z} from "zod";

const Schema=z.strictObject({
  q:z.string().trim().max(100).default(""),
  status:z.enum(["ACTIVE","ARCHIVED"]).default("ACTIVE"),
  page:z.coerce.number().int().min(1).max(1000).default(1),
});
export const COLLEGE_COMPANIES_PAGE_SIZE=25;
export type CollegeCompaniesQuery=z.infer<typeof Schema>;

export function parseCollegeCompaniesQuery(raw:Record<string,string|string[]|undefined>) {
  return Schema.safeParse(raw);
}
export function collegeCompaniesHref(query:CollegeCompaniesQuery) {
  const params=new URLSearchParams();
  if(query.q)params.set("q",query.q);
  if(query.status!=="ACTIVE")params.set("status",query.status);
  if(query.page>1)params.set("page",String(query.page));
  return "/college/companies"+(params.size?"?"+params.toString():"");
}
export function literalCompanySearch(value:string) {
  return "%"+value.replace(/[\\%_]/g,"\\$&")+"%";
}
