import { z } from "zod";

export const facultyMonthQuerySchema=z.object({
  month:z.string().regex(/^(19|20)\d{2}-(0[1-9]|1[0-2])$/),
  deliveryId:z.string().uuid().optional(),
}).strict();
export type FacultyMonthQuery=z.infer<typeof facultyMonthQuerySchema>;

/** Calendar month boundaries deliberately use Asia/Kolkata (IST) for every
 * account, rather than the legacy viewer's browser timezone. IST has no
 * daylight-saving transitions: a traveller in a DST timezone still sees
 * the same college day. A session spanning 23:59–00:01 IST must appear
 * on both days; half-open ends use endsAt - 1ms in facultyMonthGrid.
 */
export function istDateKey(date:Date) {
  const parts=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  }).formatToParts(date);
  const get=(kind:string)=>parts.find(part=>part.type===kind)?.value??"";
  return get("year")+"-"+get("month")+"-"+get("day");
}

export function currentIstMonth(now:Date) {
  return istDateKey(now).slice(0,7);
}

export function shiftMonth(month:string,delta:-1|1) {
  const q=facultyMonthQuerySchema.parse({month});
  const [year,m]=q.month.split("-").map(Number);
  return new Date(Date.UTC(year!,m!-1+delta,1)).toISOString().slice(0,7);
}

export type FacultyMonthCourse={
  deliveryId:string;sectionId:string;courseCode:string;courseName:string;
};
export type FacultyMonthEvent={
  id:string;sectionId:string;deliveryId:string|null;
  title:string;startsAt:Date;endsAt:Date;
};
export function facultyMonthGrid<T extends FacultyMonthEvent>(
  events:readonly T[],courses:readonly FacultyMonthCourse[],raw:unknown,
) {
  const query=facultyMonthQuerySchema.parse(raw);
  const [year,month]=query.month.split("-").map(Number);
  const first=new Date(Date.UTC(year!,month!-1,1));
  const offset=first.getUTCDay();
  const authorized=new Map(courses.map(course=>[course.deliveryId,course]));
  if (query.deliveryId && !authorized.has(query.deliveryId)) {
    return {authorized:false as const,query,days:[],events:[]};
  }
  const selected=courses.filter(course=>!query.deliveryId||
    course.deliveryId===query.deliveryId);
  const deliveries=new Set(selected.map(course=>course.deliveryId));
  const sections=new Set(selected.map(course=>course.sectionId));
  const valid=events.filter(event=>
    (event.deliveryId ? deliveries.has(event.deliveryId) :
      sections.has(event.sectionId)) &&
    event.endsAt.getTime()>event.startsAt.getTime(),
  );
  const days=Array.from({length:42},(_,index)=>{
    const instant=new Date(Date.UTC(year!,month!-1,index+1-offset));
    const key=instant.toISOString().slice(0,10);
    return {
      key,
      inMonth:key.slice(0,7)===query.month,
      events:valid.filter(event=>
        istDateKey(event.startsAt)<=key &&
        istDateKey(new Date(event.endsAt.getTime()-1))>=key,
      ),
    };
  });
  return {authorized:true as const,query,days,events:valid};
}

export function facultyMonthHref(query:FacultyMonthQuery) {
  const params=new URLSearchParams({month:query.month});
  if(query.deliveryId)params.set("deliveryId",query.deliveryId);
  return "/teacher/calendar?"+params.toString();
}
