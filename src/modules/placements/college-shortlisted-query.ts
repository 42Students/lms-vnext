import { z } from "zod";

const Search = z.strictObject({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
export function collegeShortlistedQuery(raw: Record<string,string|string[]|undefined>) {
  return Search.safeParse(raw);
}
export function collegeShortlistedHref(jobId: string, query: {q:string;page:number}) {
  const params=new URLSearchParams();
  if(query.q)params.set("q",query.q);
  if(query.page>1)params.set("page",String(query.page));
  const base="/college/placements/jobs/"+encodeURIComponent(jobId)+"/shortlisted";
  return base+(params.size?"?"+params.toString():"");
}
