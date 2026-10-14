import { z } from "zod";

/** Shareable search, never a tenant, membership or persisted-submission selector. */
export const learnerRoundSearchQuerySchema=z.object({
  q:z.string().trim().max(100).optional().default(""),
}).strict();

export function learnerRoundSearchFromQuery(raw:unknown):string {
  return learnerRoundSearchQuerySchema.parse(raw).q;
}

export function learnerRoundSearchHref(currentUrl:string,query:string):string {
  const q=learnerRoundSearchQuerySchema.parse({q:query}).q;
  const url=new URL(currentUrl,"https://lms.invalid");
  if(q)url.searchParams.set("q",q);
  else url.searchParams.delete("q");
  return url.pathname+url.search+url.hash;
}
