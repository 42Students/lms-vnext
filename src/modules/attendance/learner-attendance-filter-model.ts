import { z } from "zod";

export const learnerAttendanceMonthSchema = z.string().regex(/^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/);
const deliverySchema = z.string().uuid();

/** UTC instants belong to the College calendar month in IST, regardless of device timezone. */
export function learnerAttendanceIstMonth(value: string | Date): string {
  const date=new Date(value);
  if(!Number.isFinite(date.getTime()))return "";
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).formatToParts(date);
  return parts.find(part => part.type === "year")!.value + "-" +
    parts.find(part => part.type === "month")!.value;
}

export function resolveLearnerAttendanceFilters(
  input: { deliveryId?: unknown; courseId?: unknown; month?: unknown },
  courses: readonly { deliveryId: string; courseId?: string; historical?: boolean }[],
  defaultMonth: string,
) {
  const requestedDelivery = deliverySchema.safeParse(input.deliveryId).data;
  const requestedCourse=deliverySchema.safeParse(input.courseId).data;
  const courseDeliveries=requestedCourse?courses.filter(course=>course.courseId===requestedCourse):[];
  const preferred=courseDeliveries.find(course=>!course.historical)??courseDeliveries[0];
  return {
    deliveryId: courses.some(course => course.deliveryId === requestedDelivery)
      ? requestedDelivery! : preferred?.deliveryId??courses[0]?.deliveryId ?? "",
    month: learnerAttendanceMonthSchema.safeParse(input.month).data ??
      learnerAttendanceMonthSchema.parse(defaultMonth),
  };
}

export function filterLearnerAttendanceMonth<T extends { deliveryId: string; startsAt: string }>(
  rows: readonly T[], deliveryId: string, month: string,
): T[] {
  if (!deliverySchema.safeParse(deliveryId).success ||
      !learnerAttendanceMonthSchema.safeParse(month).success) return [];
  return rows.filter(row => row.deliveryId === deliveryId &&
    learnerAttendanceIstMonth(row.startsAt) === month);
}

/** A legacy course ID may resolve to multiple authorized section deliveries.
 * Never merge by course ID alone across colleges; callers provide the
 * already-scoped learner deliveries. Retain historic rows for read-only audit. */
export function learnerAttendanceDeliveryIdsForCourse(
 courseId:string,authorized:readonly {courseId:string;deliveryId:string}[],
):string[]{
 if(!deliverySchema.safeParse(courseId).success)return [];
 return [...new Set(authorized.filter(row=>row.courseId===courseId)
  .map(row=>row.deliveryId).filter(id=>deliverySchema.safeParse(id).success))];
}
export function filterLearnerHistoricCourseAttendance<T extends {
 deliveryId:string;startsAt:string;
}>(
 rows:readonly T[],authorizedDeliveryIds:readonly string[],month:string,
):T[]{
 if(!learnerAttendanceMonthSchema.safeParse(month).success)return [];
 const allowed=new Set(authorizedDeliveryIds.filter(id=>deliverySchema.safeParse(id).success));
 return rows.filter(row=>allowed.has(row.deliveryId)&&learnerAttendanceIstMonth(row.startsAt)===month);
}
