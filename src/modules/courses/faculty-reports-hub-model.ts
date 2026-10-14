import {z} from "zod";
export const facultyReportsHubQuerySchema=z.object({
  deliveryId:z.string().uuid(),
  kind:z.enum(["ALL","QUIZ","ASSIGNMENT"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyReportsHubQuery=z.infer<typeof facultyReportsHubQuerySchema>;
export function facultyReportHubHref(query:FacultyReportsHubQuery) {
  const params=new URLSearchParams();
  if(query.kind!=="ALL")params.set("kind",query.kind);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/teacher/courses/"+encodeURIComponent(query.deliveryId)+"/reports"+(suffix?"?"+suffix:"");
}
export function publishedReportBreakdown(items:readonly {kind:"QUIZ"|"ASSIGNMENT";status:string}[]){
  // A closed quiz was published and still belongs in historical reporting.
  const active=items.filter(x=>x.status==="PUBLISHED"||
    (x.kind==="QUIZ"&&x.status==="CLOSED"));
  return {
    assignments:items.filter(x=>x.kind==="ASSIGNMENT").length,
    quizzes:items.filter(x=>x.kind==="QUIZ").length,
    publishedAssignments:active.filter(x=>x.kind==="ASSIGNMENT").length,
    publishedQuizzes:active.filter(x=>x.kind==="QUIZ").length,
  };
}
export function attendanceReportCounts(sessions:readonly {markedAt:Date|null}[]){
  return {scheduled:sessions.length,marked:sessions.filter(x=>x.markedAt!==null).length};
}

/** Parse the full, untrusted URL selector bag without collapsing duplicates. */
export function parseFacultyReportsHubLocation(deliveryId:string,raw:unknown){
 const query=z.object({kind:z.enum(["ALL","QUIZ","ASSIGNMENT"]).optional(),
  page:z.string().regex(/^[1-9]\\d{0,3}$/).optional(),
 }).strict().safeParse(raw);
 if(!query.success)return facultyReportsHubQuerySchema.safeParse({deliveryId,invalid:true});
 return facultyReportsHubQuerySchema.safeParse({deliveryId,...query.data});
}
