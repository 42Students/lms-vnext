import {z} from "zod";
export const superAdminFacultyScheduleReassignSchema=z.object({
  sourceMembershipId:z.string().uuid(),
  replacementMembershipId:z.string().uuid(),
  confirmed:z.literal(true),
}).strict().refine(value=>value.sourceMembershipId!==value.replacementMembershipId,{
  message:"Choose a different replacement faculty member",
});

export type FacultyScheduleInterval = {
  id:string; startsAt:Date; endsAt:Date;
};

/** SA-academics-people-85: a candidate transfer cannot overlap target's
 * timetable or another session accepted in this same transfer. */
export function planFacultyScheduleReassignment(
  source:readonly FacultyScheduleInterval[],
  target:readonly FacultyScheduleInterval[],
) {
  const busy=target.map(item=>({start:item.startsAt.getTime(),end:item.endsAt.getTime()}));
  const movable:FacultyScheduleInterval[]=[];
  const skipped:string[]=[];
  for(const item of [...source].sort((a,b)=>a.startsAt.getTime()-b.startsAt.getTime()||
    a.id.localeCompare(b.id))) {
    const start=item.startsAt.getTime(),end=item.endsAt.getTime();
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||
      busy.some(t=>start<t.end && t.start<end)) {
      skipped.push(item.id);continue;
    }
    movable.push(item);
    busy.push({start,end});
  }
  return {movable,skipped};
}
