import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {outboundQueueRuntimeEnabled,outboundDispatchRuntimeEnabled} from "./outbound-delivery-queue";

/** No email may be dispatched based on an unverified local suppression table.
 * Global recipient HMAC suppression and the provider's pre-send fence must
 * be independently proven before an operator enables actual email sends.
 */
export function globalEmailSuppressionActivationState(){
 const queueReady=outboundQueueRuntimeEnabled();
 const dispatcherReady=outboundDispatchRuntimeEnabled();
 const senderVerified=process.env["DB10_EMAIL_SENDER_VERIFIED"]==="DB10_VERIFIED";
 const migrationVerified=process.env["DB10_GLOBAL_SUPPRESSION_VERIFIED"]==="DB10_VERIFIED";
 const keyConfigured=Boolean(process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]);
 return {
  active:queueReady&&dispatcherReady&&senderVerified&&migrationVerified&&keyConfigured,
  queueReady,dispatcherReady,senderVerified,migrationVerified,keyConfigured,
 };
}

export async function requireVerifiedGlobalEmailSuppression(){
 const state=globalEmailSuppressionActivationState();
 if(!state.active)throw new Error("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED");
 const [tables]=await Promise.all([
  getDb().execute<{global_ready:boolean;local_ready:boolean}>(sql`
   select to_regclass('public.outbound_global_email_suppressions') is not null as global_ready,
          to_regclass('public.outbound_suppressions') is not null as local_ready`),
 ]);
 if(tables.rows[0]?.global_ready!==true||tables.rows[0]?.local_ready!==true)
  throw new Error("GLOBAL_EMAIL_SUPPRESSION_NOT_VERIFIED");
 return state;
}
