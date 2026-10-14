import { z } from "zod";

export const facultyQuizAttemptsQuerySchema = z.object({
  quizId:z.string().uuid(),deliveryId:z.string().uuid(),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export const facultyQuizAttemptSearchSchema = facultyQuizAttemptsQuerySchema.omit({quizId:true});

export function facultyQuizAttemptsPage<T extends {id:string;submittedAt:Date}>(
  values:readonly T[],requested:number,
) {
  const ordered=[...values].sort((a,b)=>
    b.submittedAt.getTime()-a.submittedAt.getTime()||a.id.localeCompare(b.id));
  const pageSize=10,total=ordered.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,page,pageSize,totalPages,items:ordered.slice((page-1)*pageSize,page*pageSize)};
}

export function facultyQuizAttemptsHref(quizId:string,deliveryId:string,page=1) {
  const path="/teacher/report/quiz/"+encodeURIComponent(quizId)+"/attempts";
  const query=new URLSearchParams({deliveryId});
  if(page>1)query.set("page",String(page));
  return path+"?"+query.toString();
}
