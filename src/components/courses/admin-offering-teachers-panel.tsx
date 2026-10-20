import {facultyAssignmentRoleLabel} from "@/modules/courses/college-courses-copy";
import type {listOfferingTeachingOverview} from "@/modules/courses/college-course-teachers-service";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
type Roster=Awaited<ReturnType<typeof listOfferingTeachingOverview>>;

export function AdminOfferingTeachersPanel({roster,academicPeriodName}:{
 roster:Roster;academicPeriodName:string;
}){
 return <section id="who-teaches-it" aria-label="Who teaches it"
  className="scroll-mt-24 space-y-3 border-b border-border pb-5">
  <h2 className="text-lg font-semibold text-foreground">Who teaches it</h2>
  {!roster.faculty.length?<p className="text-sm text-muted-foreground">
   No active Faculty assignment was found for this Course Offering.
  </p>:<ul className="divide-y divide-border border-y border-border">
   {roster.faculty.map(item=><li key={item.assignmentId}
    className="min-w-0 py-3">
    <p className="break-words font-semibold text-foreground">
     {item.facultyName?.trim()||item.facultyEmail||"Unnamed Faculty"}</p>
    <p className="mt-1 text-sm text-body">
     Class: {item.sectionName} ({item.sectionCode})</p>
    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
     {academicPeriodName} <StatusBadge tone="neutral">{facultyAssignmentRoleLabel(item.role)}</StatusBadge></p>
   </li>)}
  </ul>}
  {roster.truncated?<Alert tone="info">
   Showing the first 100 active teaching assignments. Additional assignments are not listed here.
  </Alert>:null}
 </section>;
}
