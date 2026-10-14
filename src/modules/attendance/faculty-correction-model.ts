import {z} from "zod";
import {facultyAttendanceMarkingWindow} from "./faculty-marking-window";
export const facultyCorrectionQuerySchema=z.object({
  deliveryId:z.string().uuid(),
  window:z.enum(["ALL","OPEN","NOT_STARTED","WINDOW_EXPIRED"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyCorrectionQuery=z.infer<typeof facultyCorrectionQuerySchema>;
export function facultyCorrectionSessionPage(rows:readonly {
  id:string;title:string;startsAt:Date;endsAt:Date;
  attendanceStatus:string|null;
}[],query:FacultyCorrectionQuery,windowHours:number,now:Date){
  const filtered=rows.map(row=>({
    ...row,window:facultyAttendanceMarkingWindow({
      startsAt:row.startsAt,endsAt:row.endsAt,
      correctionWindowHours:windowHours,now,
    }),
  })).filter(row=>query.window==="ALL"||row.window===query.window)
    .sort((a,b)=>b.startsAt.getTime()-a.startsAt.getTime()||a.id.localeCompare(b.id));
  const total=filtered.length,pageSize=20,totalPages=Math.max(1,Math.ceil(total/pageSize));
  const page=Math.min(query.page,totalPages);
  return {total,page,pageSize,totalPages,
    items:filtered.slice((page-1)*pageSize,page*pageSize)};
}
export function facultyCorrectionHref(query:FacultyCorrectionQuery){
  const params=new URLSearchParams();
  if(query.window!=="ALL")params.set("window",query.window);
  if(query.page>1)params.set("page",String(query.page));
  const suffix=params.toString();
  return "/teacher/courses/"+encodeURIComponent(query.deliveryId)+
    "/attendance-corrections"+(suffix?"?"+suffix:"");
}
