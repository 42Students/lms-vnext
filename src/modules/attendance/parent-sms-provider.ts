import "server-only";
import {outboundFetch} from "@/lib/outbound";
import {appendSmsDeliveryAttempt} from "@/modules/notifications/exotel-sms";
import {verifiedParentPhoneSchema,type AttendanceParentSmsKind} from "./parent-sms-model";
/** COL-attendance-R02: separate, registered Indian DLT templates from OTP.
 * A configuration gap MUST never reuse the OTP sender/template or send. */
export async function sendAttendanceParentSms(input:{
 phoneE164:string;body:string;kind:AttendanceParentSmsKind;
 collegeId?:string|null;organizationId?:string|null;
},env:Record<string,string|undefined>=process.env,
 fetchImpl:typeof fetch=fetch):Promise<"ACCEPTED"|"NOT_CONFIGURED"|"REJECTED">{
 const purpose=input.kind==="ABSENT"?"attendance.absence":"attendance.correction";
 const record=async(outcome:"PROVIDER_ACCEPTED"|"FAILED",providerSid:string|null,failureCode:string|null)=>{
  // Ledger failure must never change the SMS transport outcome.
  await appendSmsDeliveryAttempt({purpose,recipient:input.phoneE164,outcome,providerSid,failureCode,
   collegeId:input.collegeId??null,organizationId:input.organizationId??null}).catch(()=>undefined);
 };
 const key=env.EXOTEL_API_KEY,token=env.EXOTEL_API_TOKEN;
 const sid=env.EXOTEL_ACCOUNT_SID,entity=env.EXOTEL_DLT_ENTITY_ID;
 const sender=env.EXOTEL_ATTENDANCE_SENDER_ID;
 const template=input.kind==="ABSENT"
  ?env.EXOTEL_ATTENDANCE_ABSENT_DLT_TEMPLATE_ID
  :env.EXOTEL_ATTENDANCE_CORRECTED_DLT_TEMPLATE_ID;
 if(!key||!token||!sid||!entity||!sender||!template||
  !/^[A-Za-z0-9_-]+$/.test(sid)||
  !/^[A-Za-z0-9]{3,12}$/.test(sender)||
  !verifiedParentPhoneSchema.safeParse(input.phoneE164).success||
  !input.body||input.body.length>1000){
  await record("FAILED",null,"ATTENDANCE_NOT_CONFIGURED");
  return "NOT_CONFIGURED";
 }
 const form=new URLSearchParams({
  From:sender,To:input.phoneE164,Body:input.body,
  DltEntityId:entity,DltTemplateId:template,
  SmsType:env.EXOTEL_ATTENDANCE_SMS_TYPE??"transactional_opt_in",Priority:"high",
 });
 try{
  const response=await outboundFetch(
   "https://api.exotel.com/v1/Accounts/"+sid+"/Sms/send.json",{
    method:"POST",headers:{
     Authorization:"Basic "+Buffer.from(key+":"+token).toString("base64"),
     "Content-Type":"application/x-www-form-urlencoded",Accept:"application/json",
    },body:form,timeoutMs:10000,maxAttempts:1,fetchImpl,
   });
  if(!response.ok){
   await record("FAILED",null,"PROVIDER_HTTP_REJECTED");
   return "REJECTED";
  }
  const body=await response.json() as {SMSMessage?:{Sid?:string;Status?:string}};
  const accepted=Boolean(body.SMSMessage?.Sid && body.SMSMessage.Status &&
   !body.SMSMessage.Status.toLowerCase().startsWith("failed"));
  await record(accepted?"PROVIDER_ACCEPTED":"FAILED",
   accepted?body.SMSMessage?.Sid??null:null,accepted?null:"PROVIDER_NOT_ACCEPTED");
  return accepted?"ACCEPTED":"REJECTED";
 }catch{
  await record("FAILED",null,"PROVIDER_UNAVAILABLE");
  return "REJECTED";
 }
}
