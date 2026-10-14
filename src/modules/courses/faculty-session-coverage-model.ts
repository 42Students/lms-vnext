import {z} from "zod";
export const facultySessionCoverageSchema=z.object({deliveryId:z.string().uuid()}).strict();
export type FacultySessionRow={
  id:string;title:string;startsAt:string;endsAt:string;
  attendanceStatus:string|null;
};
export function facultySessionCoverage(rows:readonly FacultySessionRow[],nowIso:string){
  const byNewest=[...rows].sort((a,b)=>b.startsAt.localeCompare(a.startsAt)||
    a.id.localeCompare(b.id));
  return {
    total:rows.length,
    marked:rows.filter(row=>row.attendanceStatus==="MARKED").length,
    completedUnmarked:rows.filter(row=>row.attendanceStatus!=="MARKED"&&
      row.endsAt<nowIso).length,
    upcoming:rows.filter(row=>row.startsAt>nowIso).length,
    shown:byNewest.slice(0,40).map(row=>({...row,
      label:row.attendanceStatus==="MARKED"?"Marked":
        row.startsAt>nowIso?"Upcoming":row.endsAt<nowIso?"Ended without marks":"In progress/unmarked",
    })),
    omitted:Math.max(0,rows.length-40),
  };
}
