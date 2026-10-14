import { z } from "zod";

export const mentorProjectActivityQuerySchema=z.object({
  projectId:z.string().uuid(),
  importance:z.enum(["ALL","LOW","NORMAL","HIGH","CRITICAL"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type MentorProjectActivityQuery=z.infer<typeof mentorProjectActivityQuerySchema>;

export function mentorProjectActivityPage(total:number,requested:number) {
  const pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,pageSize,totalPages,page};
}

export function mentorProjectActivityHref(query:MentorProjectActivityQuery) {
  const params=new URLSearchParams();
  if(query.importance!=="ALL")params.set("importance",query.importance);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/mentor/projects/"+encodeURIComponent(query.projectId)+"/activity-history"+
    (suffix?"?"+suffix:"");
}
