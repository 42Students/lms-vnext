import { z } from "zod";

export const facultyQuizAttemptsQuerySchema = z.object({
  quizId:z.string().uuid(),deliveryId:z.string().uuid(),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  page:z.union([
    z.number().int(),
    z.string().regex(/^[1-9]\d{0,3}$|^10000$/).transform(Number),
  ]).pipe(z.number().int().min(1).max(10000)).default(1),
}).strict();

export const facultyQuizAttemptSearchSchema = facultyQuizAttemptsQuerySchema.omit({quizId:true});

export function facultyQuizAttemptsPage<T extends {id:string;submittedAt:Date}>(
  values:readonly T[],requested:number,order:"NEWEST"|"OLDEST"="NEWEST",
) {
  const ordered=[...values].sort((a,b)=>
    (order==="NEWEST"?b.submittedAt.getTime()-a.submittedAt.getTime():a.submittedAt.getTime()-b.submittedAt.getTime())||a.id.localeCompare(b.id));
  const pageSize=10,total=ordered.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,page,pageSize,totalPages,items:ordered.slice((page-1)*pageSize,page*pageSize)};
}

export function facultyQuizAttemptsHref(quizId:string,deliveryId:string,page=1,order:"NEWEST"|"OLDEST"="NEWEST") {
  const path="/teacher/report/quiz/"+encodeURIComponent(quizId)+"/attempts";
  const query=new URLSearchParams({deliveryId});
  if(page>1)query.set("page",String(page));
  if(order!=="NEWEST")query.set("order",order);
  return path+"?"+query.toString();
}
