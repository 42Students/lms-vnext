import type {AttendanceParentSmsKind} from "./parent-sms-model";

/** Guard a queued guardian notification against the CURRENT attendance
 * verdict, not against physical presence/absence of a database row.
 *
 * DB06 keeps explicit PRESENT rows for stable immutable history. During the
 * transition, legacy correction-to-present rows may still be absent, so a
 * missing record is eligible for CORRECTED only (never for ABSENT).
 *
 * Provider retry is still separately gated on fresh verified parent consent,
 * the same college and an atomic queue lease.
 */
export function attendanceParentSmsCurrentStateEligible(
 kind:AttendanceParentSmsKind,
 currentStatus:string|null|undefined,
):boolean{
 if(kind==="ABSENT")return currentStatus==="ABSENT";
 if(kind==="CORRECTED")return currentStatus==null||currentStatus==="PRESENT";
 return false;
}
