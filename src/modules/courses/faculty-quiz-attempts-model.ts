import { z } from "zod";

export const facultyQuizAttemptsQuerySchema = z.object({
  quizId:z.string().uuid(),deliveryId:z.string().uuid(),
  order:z.enum(["NEWEST","OLDEST"]).default("NEWEST"),
  q:z.string().trim().max(120).default(""),
  view:z.enum(["ALL","LATEST"]).default("ALL"),
  page:z.union([
    z.number().int(),
    z.string().regex(/^[1-9]\d{0,3}$|^10000$/).transform(Number),
  ]).pipe(z.number().int().min(1).max(10000)).default(1),
}).strict();

export const facultyQuizAttemptSearchSchema = facultyQuizAttemptsQuerySchema.omit({quizId:true});

export function facultyQuizAttemptsPage<T extends {id:string;submittedAt:Date}>(
  values:readonly T[],requested:number,order:"NEWEST"|"OLDEST"="NEWEST",
) {
  const timestamp = (date: Date) => {
    const instant = date.getTime();
    return Number.isFinite(instant) ? instant : 0;
  };
  const ordered=[...values].sort((a,b)=>
    (order==="NEWEST"?timestamp(b.submittedAt)-timestamp(a.submittedAt):
      timestamp(a.submittedAt)-timestamp(b.submittedAt))||a.id.localeCompare(b.id));
  const pageSize=10,total=ordered.length,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const safeRequested=Number.isSafeInteger(requested)&&requested>0?requested:1;
  const page=Math.min(safeRequested,totalPages);
  return {total,page,pageSize,totalPages,items:ordered.slice((page-1)*pageSize,page*pageSize)};
}

export function facultyQuizAttemptsHref(quizId:string,deliveryId:string,page=1,order:"NEWEST"|"OLDEST"="NEWEST",q="",view:"ALL"|"LATEST"="ALL") {
  const path="/teacher/report/quiz/"+encodeURIComponent(quizId)+"/attempts";
  const query=new URLSearchParams({deliveryId});
  if(page>1)query.set("page",String(page));
  if(order!=="NEWEST")query.set("order",order);
  if(q.trim())query.set("q",q.trim());
  if(view==="LATEST")query.set("view",view);
  return path+"?"+query.toString();
}

/** Filter only the already-scoped attempt rows; never broaden Faculty access. */
export function facultySearchQuizAttempts<T extends {
  learnerDisplayName:string|null;learnerEmail:string|null;
}>(rows:readonly T[],term:string):T[]{
 const needle=term.trim().toLocaleLowerCase();
 return needle?rows.filter(row=>[row.learnerDisplayName,row.learnerEmail]
   .some(value=>value?.toLocaleLowerCase().includes(needle))):[...rows];
}
