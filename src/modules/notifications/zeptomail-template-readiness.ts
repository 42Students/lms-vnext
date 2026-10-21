import "server-only";
import {writeStructuredLog} from "@/observability/logger";
import {LEGACY_NOTIFICATION_TEMPLATE_KEYS,readZeptoMailConfig,
 resolveZeptoMailTemplateId,type LegacyMailEvent} from "./zeptomail-email";
import {LEGACY_NOTIFICATION_CHANNELS} from "@/modules/messaging/providers";

/** Deliberately status-only. Never emit provider IDs, credentials, addresses
 * or merge variables into logs, UI or a readiness response. */
export type LegacyTemplateStatus="READY"|"MISSING TEMPLATE"|"CHANNEL DISABLED";
export type LegacyTemplateReadiness={
 event:string;status:LegacyTemplateStatus;channel:"EMAIL"|"SMS";required:boolean;
};
const events=Object.keys(LEGACY_NOTIFICATION_TEMPLATE_KEYS) as LegacyMailEvent[];
// Compile-time registry coverage: every typed event has a channel policy.
const checkedRegistry:Readonly<Record<LegacyMailEvent,readonly ("IN_APP"|"EMAIL"|"SMS")[]>>=
 LEGACY_NOTIFICATION_CHANNELS;
export function resolveLegacyMailTemplateStatus(
 event:LegacyMailEvent|null|undefined,
 env:Record<string,string|undefined>=process.env,
):LegacyTemplateStatus{
 if(!event||!Object.prototype.hasOwnProperty.call(checkedRegistry,event))
  return "MISSING TEMPLATE";
 if(!checkedRegistry[event].includes("EMAIL"))return "CHANNEL DISABLED";
 const id=resolveZeptoMailTemplateId({kind:"EVENT",event},env,readZeptoMailConfig(env));
 return id?"READY":"MISSING TEMPLATE";
}
export function zeptoMailTemplateReadiness(env:Record<string,string|undefined>=process.env){
 const config=readZeptoMailConfig(env);
 const mapped:LegacyTemplateReadiness[]=events.map(event=>{
  const status=resolveLegacyMailTemplateStatus(event,env);
  return {event,status,channel:"EMAIL",required:checkedRegistry[event].includes("EMAIL")};
 });
 mapped.push({event:"SYSTEM_OTP_SMS",channel:"SMS",required:false,status:"CHANNEL DISABLED"});
 const otp=resolveZeptoMailTemplateId({kind:"OTP"},env,config);
 return {ready:!!otp && mapped.every(item=>!item.required||item.status==="READY"),
  otpReady:Boolean(otp),events:mapped,missing:mapped.filter(item=>item.required&&item.status!=="READY").length,
  disabled:mapped.filter(item=>item.status==="CHANNEL DISABLED").length};
}
let didLogReadiness=false;
/** Runs once per server worker, while operations can re-check on demand. No
 * network I/O or exception prevents startup; unconfigured sends fail closed.
 * The deployment must provision all required EMAIL events before production.
 */
export function logInitialZeptoMailTemplateReadiness(
 env:Record<string,string|undefined>=process.env,
){
 if(didLogReadiness)return zeptoMailTemplateReadiness(env);
 didLogReadiness=true;
 const report=zeptoMailTemplateReadiness(env);
 for(const item of report.events){
  if(item.required && item.status==="MISSING TEMPLATE")
   writeStructuredLog("WARNING","MISSING TEMPLATE",{event:item.event,channel:item.channel});
 }
 if(!report.otpReady)writeStructuredLog("WARNING","MISSING TEMPLATE",{event:"SYSTEM_OTP_EMAIL",channel:"EMAIL"});
 if(report.ready)writeStructuredLog("INFO","All ZeptoMail template IDs are configured",{
  configured:report.events.filter(row=>row.status==="READY").length,
  intentionallyDisabled:report.disabled,
 });
 else writeStructuredLog("WARNING","STARTUP WARNING: ZeptoMail transactional emails with missing templates will be skipped",{
  missing:report.missing,otpReady:report.otpReady,
 });
 return report;
}
