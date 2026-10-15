import {z} from "zod";
/** Preserve the authorized Course and calendar month when resetting only history selectors. */
export function learnerAttendanceHistoryResetHref(deliveryId:string,month:string):string {
  const course=z.string().uuid().parse(deliveryId);
  const ym=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).parse(month);
  return `/learn/attendance?deliveryId=${encodeURIComponent(course)}&month=${encodeURIComponent(ym)}`;
}
