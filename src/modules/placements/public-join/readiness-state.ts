import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
export type PublicJoinUnavailable = "PROXY_UNVERIFIED"|"OTP_NOT_CONFIGURED"|"RATE_TABLE_MISSING"|null;
/** No need for an obsolete PUBLIC_JOIN_RATE_EVENTS_READY environment flag:
 * migration 0100 is real; readiness checks actual PostgreSQL registration.
 */
export async function publicJoinUnavailable():Promise<PublicJoinUnavailable>{
 if(process.env["PUBLIC_JOIN_TRUSTED_PROXY_READY"]!=="VERIFIED")return "PROXY_UNVERIFIED";
 if(Buffer.byteLength(process.env["TPO_RECRUITER_OTP_HMAC_SECRET"]??"","utf8")<32)
  return "OTP_NOT_CONFIGURED";
 try{
  const r=await getDb().execute<{ok:boolean}>(sql`select to_regclass('public.placement_public_join_rate_events') is not null as ok`);
  if(r.rows[0]?.ok!==true)return "RATE_TABLE_MISSING";
 }catch{return "RATE_TABLE_MISSING";}
 return null;
}
export function publicJoinUnavailableCopy(code:PublicJoinUnavailable){
 return code===null?null:
  "Recruiter verification is temporarily unavailable. The placement cell must enable verified client networking, email-code delivery and public join storage before recruiters can join.";
}
