import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import { route } from "@/security/route";
import { CACHE } from "@/security/responses";
export const runtime="nodejs";
/** Legacy /api/v1/attendance/bulk accepted numeric classScheduleId and
 * student identifiers. Those are not safe vNext authorization keys. The
 * client must resolve a selected, college-scoped scheduleEventId, deliveryId
 * and active membership UUIDs before a full-roster save. No silent remap or
 * partial marking is allowed.
 */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return NextResponse.json({
  error:"LEGACY_ATTENDANCE_BULK_RETIRED",
  replacementMethod:"PATCH",
  replacementPath:"/api/attendance/faculty/sessions/{scheduleEventId}",
  fields:{
   classScheduleId:"scheduleEventId (scoped UUID path, not numeric ID)",
   absentStudentIds:"absentMembershipIds (active membership UUIDs)",
   presentStudentIds:"presentMembershipIds (active membership UUIDs)",
   reason:"correctionReason",
   deliveryId:"selected delivery UUID, required",
  },
  transaction:"Atomic entire active roster; no partial saves",
 },{status:410,headers:{"Cache-Control":CACHE.NONE}});
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
