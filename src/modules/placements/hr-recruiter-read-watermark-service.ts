import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementRecruiterNotificationReads} from "@/db/schema/tpo-collaboration";

/** The legacy recruiter feed starts with a bounded seven-day lookback and
 * transitions to an exact persisted recruiter+college read-through marker on
 * first acknowledgement. Call only after the recipient/college grant check.
 * This is an internal query helper, not a permission grant. */
export async function getRecruiterNotificationReadThreshold(
 recruiterUserId:string,collegeId:string,now:Date=new Date(),
){
 const [marker]=await getDb().select({
  readThrough:placementRecruiterNotificationReads.readThrough,
 }).from(placementRecruiterNotificationReads).where(and(
  eq(placementRecruiterNotificationReads.recruiterUserId,recruiterUserId),
  eq(placementRecruiterNotificationReads.collegeId,collegeId),
 )).limit(1);
 return {
  firstVisit:!marker,
  readThrough:marker?.readThrough??null,
  unreadSince:marker?.readThrough??new Date(now.getTime()-7*86400000),
 };
}
