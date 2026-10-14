import { z } from "zod";

export const facultySubmissionFilterSchema=z.enum(["ALL","GRADED","UNGRADED","LATE"]);
export type FacultySubmissionFilter=z.infer<typeof facultySubmissionFilterSchema>;

export const facultySubmissionListQuerySchema=z.object({
  assignmentId:z.string().uuid(),
  deliveryId:z.string().uuid(),
  filter:facultySubmissionFilterSchema.default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultySubmissionListQuery=z.infer<typeof facultySubmissionListQuerySchema>;

export function selectFacultyAssignmentSubmissions<T extends {
  gradingStatus:string;submittedAt:Date;
}>(rows:readonly T[],filter:FacultySubmissionFilter,dueAt:Date|null) {
  return rows.filter(row=>
    filter==="ALL" ||
    (filter==="GRADED" && row.gradingStatus==="GRADED") ||
    (filter==="UNGRADED" && row.gradingStatus!=="GRADED") ||
    (filter==="LATE" && dueAt!==null && row.submittedAt.getTime()>dueAt.getTime()),
  ).slice().sort((a,b)=>b.submittedAt.getTime()-a.submittedAt.getTime());
}

export function facultySubmissionListPage<T>(rows:readonly T[],requested:number) {
  const total=rows.length,pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(requested,totalPages);
  return {total,pageSize,totalPages,page,items:rows.slice((page-1)*pageSize,page*pageSize)};
}

export function facultySubmissionListHref(query:FacultySubmissionListQuery) {
  const params=new URLSearchParams({deliveryId:query.deliveryId});
  if(query.filter!=="ALL")params.set("filter",query.filter);
  if(query.page>1)params.set("page",String(query.page));
  return "/teacher/report/assignment/"+encodeURIComponent(query.assignmentId)+
    "/submissions?"+params.toString();
}
