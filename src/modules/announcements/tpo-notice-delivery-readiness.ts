import "server-only";

import { env } from "@/config/env";
/** Operator attestation, not inferred from the existence of a source file.
 * A verified scheduler must call the leased POST endpoint every minute, with
 * deployed storage, a valid secret and successful recipient delivery checks.
 * No request handler or page render starts a scheduler.
 */
export function tpoNoticeDeliveryVerified():boolean{
 const secret=env.TPO_NOTICE_SCHEDULER_SECRET??"";
 return env.TPO_NOTICE_DELIVERY_VERIFIED==="VERIFIED"&&
  Buffer.byteLength(secret,"utf8")>=32;
}
