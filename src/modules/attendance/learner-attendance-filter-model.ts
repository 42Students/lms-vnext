import { z } from "zod";

export const learnerAttendanceMonthSchema = z.string().regex(/^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/);
const deliverySchema = z.string().uuid();

/** UTC instants belong to the College calendar month in IST, regardless of device timezone. */
export function learnerAttendanceIstMonth(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit",
  }).formatToParts(new Date(value));
  return parts.find(part => part.type === "year")!.value + "-" +
    parts.find(part => part.type === "month")!.value;
}

export function resolveLearnerAttendanceFilters(
  input: { deliveryId?: unknown; month?: unknown },
  courses: readonly { deliveryId: string }[],
  defaultMonth: string,
) {
  const requestedDelivery = deliverySchema.safeParse(input.deliveryId).data;
  return {
    deliveryId: courses.some(course => course.deliveryId === requestedDelivery)
      ? requestedDelivery! : courses[0]?.deliveryId ?? "",
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
