import {z} from "zod";
import {learnerAttendanceMonthSchema} from "./learner-attendance-filter-model";
import { zUuid } from "@/lib/schema-primitives";
const uuid=zUuid;
/** Never produce an arbitrary course URL from unvalidated selection. */
export function learnerAttendanceCourseHistoryHref(
 deliveryId:unknown,month:unknown,
):string|null {
 const course=uuid.safeParse(deliveryId);
 if(!course.success)return null;
 const selectedMonth=learnerAttendanceMonthSchema.safeParse(month);
 const query=selectedMonth.success ? "?month="+encodeURIComponent(selectedMonth.data) : "";
 return "/learn/courses/"+encodeURIComponent(course.data)+"/attendance-summary"+query;
}
