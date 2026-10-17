import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {db10LogAlertStates} from "@/db/schema/db10-log-alerts.draft";
import {type RequestContext} from "@/modules/identity/context";
import {requireGlobalLogAdmin,listKnownErrorsForAdmin} from "./admin-service";
import {sendTelegramAlert,telegramAlertsConfigured} from "./telegram-notifier";
import {logAlertsRuntimeEnabled} from "./readiness";

export type ManualAlertKind="TEST"|"DIGEST";
export async function sendManualTelegramAlertForAdmin(
  context:RequestContext,kind:ManualAlertKind,now=new Date(),
):Promise<{sent:boolean;reason:"SENT"|"UNCONFIGURED"|"RATE_LIMITED"|"DELIVERY_FAILED"}>{
  requireGlobalLogAdmin(context);
  if(!logAlertsRuntimeEnabled()||!telegramAlertsConfigured())
    return {sent:false,reason:"UNCONFIGURED"};
  let message="42 Tracker manual test alert. This is a test; no customer issue was detected.";
  if(kind==="DIGEST"){
    const environment=process.env.APP_ENV==="production"?"PRODUCTION":
      process.env.APP_ENV==="uat"?"UAT":"DEVELOPMENT";
    const latest=await listKnownErrorsForAdmin(context,{environment,limit:100});
    message=[
      "42 Tracker manual error digest (latest 100 signatures)",
      "Environment: "+environment,
      "Open: "+latest.filter(item=>item.fixStatus==="OPEN").length,
      "Marked fixed: "+latest.filter(item=>item.fixStatus==="FIXED").length,
      "Muted: "+latest.filter(item=>item.muted).length,
      "Regressions: "+latest.filter(item=>item.regressedAt).length,
      "New error types in last 24h: "+latest.filter(item=>
        item.firstSeenAt.getTime()>=now.getTime()-86_400_000).length,
      "Top signatures:",
      ...latest.slice(0,5).map(item=>
        item.signatureHash.slice(0,12)+": "+item.occurrenceCount+" occurrences"),
      "See the Logs page for complete history.",
    ].join("\n");
  }
  // A transaction-held state lock serializes sends across replicas. A failed
  // provider response does not consume the 10-minute test/digest throttle.
  const stateKey="MANUAL_"+kind;
  return getDb().transaction(async tx=>{
    await tx.insert(db10LogAlertStates).values({stateKey}).onConflictDoNothing();
    const [state]=await tx.select().from(db10LogAlertStates)
      .where(eq(db10LogAlertStates.stateKey,stateKey)).for("update").limit(1);
    if(!state)return {sent:false,reason:"DELIVERY_FAILED" as const};
    if(state.burstMinuteAt&&now.getTime()-state.burstMinuteAt.getTime()<600_000)
      return {sent:false,reason:"RATE_LIMITED" as const};
    const sent=await sendTelegramAlert(message);
    if(!sent)return {sent:false,reason:"DELIVERY_FAILED" as const};
    await tx.update(db10LogAlertStates).set({burstMinuteAt:now,burstCount:1})
      .where(eq(db10LogAlertStates.stateKey,stateKey));
    return {sent:true,reason:"SENT" as const};
  });
}
