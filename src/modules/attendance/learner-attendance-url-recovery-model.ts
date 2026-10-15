import {learnerAttendanceMonthSchema} from "./learner-attendance-filter-model";
import {learnerAttendanceHistoryFilterSchema} from "./learner-attendance-history-model";
import {learnerAttendanceOrderSchema} from "./learner-attendance-history-order-model";
/** Invalid or stale deep links recover to existing, membership-scoped choices. */
export function learnerAttendanceUrlRecoveryNotice(
 raw:{deliveryId:string|null;month:string|null;status:string|null;order:string|null},
 courses:readonly {deliveryId:string}[],
):string|null{
 if(raw.deliveryId!==null && !courses.some(course=>course.deliveryId===raw.deliveryId)){
  return "That course selection is not available. Showing your available attendance instead.";
 }
 if(raw.month!==null && !learnerAttendanceMonthSchema.safeParse(raw.month).success){
  return "The requested month is invalid. Showing the current attendance month.";
 }
 if(raw.status!==null && !learnerAttendanceHistoryFilterSchema.safeParse(raw.status).success){
  return "The attendance status filter is invalid. Showing all statuses.";
 }
 if(raw.order!==null && !learnerAttendanceOrderSchema.safeParse(raw.order).success){
  return "The attendance order is invalid. Showing newest sessions first.";
 }
 return null;
}
