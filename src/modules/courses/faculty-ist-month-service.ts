import "server-only";

import {
  hasActiveMembership,hasMembershipRole,type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError,can } from "@/modules/permissions/policy";
import { getFacultyClassSchedule } from "./faculty-schedule-service";
import {
  facultyMonthGrid,facultyMonthQuerySchema,
} from "./faculty-ist-month-model";

/** Uses only exact authorized teaching deliveries and persisted scheduled sessions. */
export async function getFacultyIstMonth(context:RequestContext,raw:unknown) {
  const input=facultyMonthQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||
      !hasMembershipRole(context,"FACULTY")||
      !can(context,"courses.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      }))throw new AuthorizationError("courses.read");
  const schedule=await getFacultyClassSchedule(context);
  const grid=facultyMonthGrid(schedule.events,schedule.courses,input);
  if(!grid.authorized)throw new AuthorizationError("courses.read");
  return {schedule,grid};
}
