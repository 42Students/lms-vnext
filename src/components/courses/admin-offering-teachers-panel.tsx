import {facultyAssignmentRoleLabel} from "@/modules/courses/college-courses-copy";
import type {listOfferingTeachingOverview} from "@/modules/courses/college-course-teachers-service";
type Roster=Awaited<ReturnType<typeof listOfferingTeachingOverview>>;

export function AdminOfferingTeachersPanel({roster,academicPeriodName}:{
 roster:Roster;academicPeriodName:string;
}){
 return <section id="who-teaches-it" aria-label="Who teaches it"
  className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="text-lg font-semibold text-foreground">Who teaches it</h2>
  {!roster.faculty.length?<p className="text-sm text-muted-foreground">
   No active Faculty assignment was found for this Course Offering.
  </p>:<ul className="grid gap-3 md:grid-cols-2">
   {roster.faculty.map(item=><li key={item.assignmentId}
    className="min-w-0 rounded-md border border-border p-3">
    <p className="break-words font-semibold text-foreground">
     {item.facultyName?.trim()||item.facultyEmail||"Unnamed Faculty"}</p>
    <p className="mt-1 text-sm text-body">
     Class: {item.sectionName} ({item.sectionCode})</p>
    <p className="mt-1 text-xs text-muted-foreground">
     {academicPeriodName} · {facultyAssignmentRoleLabel(item.role)}</p>
   </li>)}
  </ul>}
  {roster.truncated?<p role="status" className="text-xs text-muted-foreground">
   Showing the first 100 active teaching assignments. Additional assignments are not listed here.
  </p>:null}
 </section>;
}
