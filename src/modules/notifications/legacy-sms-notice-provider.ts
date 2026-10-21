import "server-only";
import {
 createOutboundProvider,readOutboundProviderConfig,
 registeredNoticeSmsTemplate,registeredAttendanceSmsTemplate,
 type OutboundProviderOutcome,
} from "@/modules/messaging/providers";
import {appendSmsDeliveryAttempt} from "./exotel-sms";
import type {ApprovedSmsTemplateRequest,ApprovedNotificationSmsProvider,
 SmsDeliveryAcceptance,ApprovedSmsPurpose} from "./types";

/** This adapter accepts only deployment-registered templates and DLT headers;
 * caller-supplied body text cannot become a new template. */
export function createApprovedNotificationSmsProvider(
 env:Record<string,string|undefined>=process.env,
):ApprovedNotificationSmsProvider {
 const notice=registeredNoticeSmsTemplate(env);
 const absence=registeredAttendanceSmsTemplate("attendance.absence",env);
 const correction=registeredAttendanceSmsTemplate("attendance.correction",env);
 const config=readOutboundProviderConfig({
  ...(notice?{notification:notice}:{}),
  ...(absence?{"attendance.absence":absence}:{}),
  ...(correction?{"attendance.correction":correction}:{}),
 });
 const provider=createOutboundProvider(config,fetch,env);
 async function send(message:ApprovedSmsTemplateRequest):Promise<SmsDeliveryAcceptance>{
  const template=config.templates[message.purpose];
  if(!template||!template.exotelDltTemplateId||
    template.exotelDltTemplateId!==message.dltTemplateId||
    template.exotelSenderId!==message.senderId||
    template.exotelDltTemplateId===config.sms.otpDltTemplateId){
   return {status:"NOT_CONFIGURED",reason:"APPROVED_DLT_TEMPLATE_NOT_CONFIGURED"};
  }
  let outcome:OutboundProviderOutcome;
  try{outcome=await provider.sendDetailed({
    channel:"SMS",recipient:message.phoneE164,
    templateKey:message.purpose,purpose:message.purpose,
    variables:{...message.variables},
  });}
  catch{outcome={status:"FAILED",reason:"PROVIDER_UNAVAILABLE"};}
  if(outcome.status==="ACCEPTED"||outcome.status==="FAILED"){
   const code=outcome.status==="FAILED"?
    outcome.reason.replace(/[^A-Z0-9_]/gi,"_").slice(0,40).toUpperCase():null;
   await appendSmsDeliveryAttempt({
    purpose:message.purpose,recipient:message.phoneE164,
    outcome:outcome.status==="ACCEPTED"?"PROVIDER_ACCEPTED":"FAILED",
    providerSid:outcome.status==="ACCEPTED"?outcome.providerSid??null:null,
    failureCode:code,collegeId:message.collegeId,
    organizationId:message.organizationId,sourceEventId:message.sourceEventId,
   });
  }
  return outcome.status==="ACCEPTED"
    ?{status:"ACCEPTED",...(outcome.providerSid?{providerSid:outcome.providerSid}:{})}:
    {status:outcome.status,reason:outcome.reason};
 }
 return {
  sendSmsWithTemplate:send,
  sendJobUpdateSms:message=>send({...message,purpose:"job.update"}),
  sendNotification:message=>send({...message,purpose:"notification"}),
 };
}
export function approvedSmsPurpose(value:string):value is ApprovedSmsPurpose {
 return value==="job.update"||value==="notification"||
  value==="attendance.absence"||value==="attendance.correction";
}
