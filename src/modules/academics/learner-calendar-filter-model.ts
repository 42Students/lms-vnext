import { z } from "zod";
import { learnerScheduleIstDay } from "./learner-ist-schedule-model";

export const learnerCalendarQuerySchema=z.object({
  view:z.enum(["week","month","day"]).optional(),
  month:z.string().regex(/^(20\d{2}|21\d{2})-(0[1-9]|1[0-2])$/).optional(),
  deliveryId:z.string().uuid().optional(),
}).strict();

/** Route filters may choose only persisted, already-authorized learner deliveries. */
export function resolveOwnLearnerCalendarFilters(
  raw: unknown,
  courses: readonly {deliveryId:string}[],
  today:Date,
) {
  const result=learnerCalendarQuerySchema.safeParse(raw);
  if(!result.success) return null;
  const query=result.data;
  const ids=courses.map(course=>course.deliveryId);
  if(query.deliveryId && !ids.includes(query.deliveryId)) return null;
  const year=query.month ? Number(query.month.slice(0,4)) : today.getFullYear();
  const month=query.month ? Number(query.month.slice(5,7))-1 : today.getMonth();
  return {
    view:query.view ?? "week",
    anchorDay: query.month ? query.month + "-01" : learnerScheduleIstDay(today),
    anchor:query.month ? new Date(year,month,1) : today,
    selectedDeliveryIds:query.deliveryId ? [query.deliveryId] : ids,
  };
}