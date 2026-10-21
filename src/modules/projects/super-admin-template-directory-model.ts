import { z } from "zod";
export const templateDirectoryQuerySchema=z.object({
 q:z.string().trim().max(100).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","ARCHIVED"]).default("ALL"),
 page:z.union([
  z.number().int().min(1).max(1000),
  z.string().regex(/^[0-9]+$/).transform(Number)
    .pipe(z.number().int().min(1).max(1000)),
]).default(1),
}).strict();
export const TEMPLATE_DIRECTORY_PAGE_SIZE=10;
export function templateDirectoryPages(total:number){
 if(!Number.isFinite(total)||total<0)return 1;
 return Math.max(1,Math.ceil(total/TEMPLATE_DIRECTORY_PAGE_SIZE));
}
export function templateDirectoryHref(query:z.infer<typeof templateDirectoryQuerySchema>){
 const search=new URLSearchParams();
 if(query.q)search.set("q",query.q);
 if(query.status!=="ALL")search.set("status",query.status);
 if(query.page>1)search.set("page",String(query.page));
 return "/admin/projects/templates"+(search.size?"?"+search:"");
}

/** Forged or stale URL keys should never be silently ignored on an admin
 * catalogue. Reject repeated filters before the database read.
 */
export function parseSuperAdminTemplateDirectoryQuery(
  params:Record<string,string|string[]|undefined>,
){
  if(Object.keys(params).some(key=>!["q","search","status","page"].includes(key))||
     Object.values(params).some(Array.isArray))
    return templateDirectoryQuerySchema.safeParse(null);
  const normalized={...params};
  delete normalized.search;
  if(params.search!==undefined&&params.q===undefined)normalized.q=params.search;
  if(typeof normalized.status==="string"&&
      !["ALL","DRAFT","PUBLISHED","ARCHIVED"].includes(normalized.status))
    normalized.status="ALL";
  return templateDirectoryQuerySchema.safeParse(normalized);
}
