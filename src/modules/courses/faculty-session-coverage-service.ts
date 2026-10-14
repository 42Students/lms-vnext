import "server-only";
import {getFacultyAttendanceWorkspace} from "@/modules/attendance/faculty-service";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can,AuthorizationError} from "@/modules/permissions/policy";
import {facultySessionCoverage,facultySessionCoverageSchema}
  from "./faculty-session-coverage-model";

/** No record is treated as absent/present until persisted marks actually exist. */
export async function getFacultySessionCoverage(context:RequestContext,raw:unknown){
  const {deliveryId}=facultySessionCoverageSchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"FACULTY")||
    !can(context,"courses.read",{
      collegeId:membership.collegeId,organizationId:membership.organizationId,
    }))throw new AuthorizationError("courses.read");
  const data=await getFacultyAttendanceWorkspace(context,deliveryId);
  const nowIso=new Date().toISOString();
  const summary=facultySessionCoverage(data.sessions.map(row=>({
    id:row.id,title:row.title,startsAt:row.startsAt.toISOString(),
    endsAt:row.endsAt.toISOString(),attendanceStatus:row.attendanceStatus,
  })),nowIso);
  return {course:data.course,nowIso,...summary};
}
