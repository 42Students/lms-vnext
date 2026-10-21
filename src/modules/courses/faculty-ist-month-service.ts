import "server-only";

import {
  hasActiveMembership,hasMembershipRole,type RequestContext,
} from "@/modules/identity/context";
import { AuthorizationError,can } from "@/modules/permissions/policy";
import { getFacultyClassSchedule } from "./faculty-schedule-service";
import {
  facultyMonthGrid,facultyMonthQuerySchema,
} from "./faculty-ist-month-model";

/** Legacy schedule GET facultyId/startDate/endDate maps to an authorized
 * membership (never a caller-supplied faculty ID) and a bounded IST month
 * window. The 42-cell range includes the trailing/leading adjacent days.
 * Faculty permission checks precede all schedule data access. */
export function facultyIstMonthDateRange(month: string) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year!, number! - 1, 1));
  const start = new Date(first);
  start.setUTCDate(1 - first.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 42);
  return { startDate: start.toISOString().slice(0, 10),
    endDate: new Date(end.getTime() - 1).toISOString().slice(0, 10) };
}

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
