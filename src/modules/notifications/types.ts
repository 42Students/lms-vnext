/**
 * Delivery ports. Domain code depends on these interfaces only, so tests use
 * in-memory fakes and no test can ever send a real SMS or email.
 */

export interface SmsProvider {
  /** Resolves true only after provider acceptance, never merely HTTP success.
   * Exotel performs a bounded network request and returns false on timeout. */
  sendOtp(phoneE164: string, code: string): Promise<boolean>;
}

export type OtpEmail = {
  toEmail: string;
  displayName: string;
  code: string;
  phoneE164?: string | null;
};

export interface EmailProvider {
  /** Resolves true only when the provider ACCEPTED the message. */
  sendOtpEmail(message: OtpEmail): Promise<boolean>;
}

/** Purpose-bound, separately DLT-registered transactional notices. OTP
 * cannot be reused for jobs, attendance or general notifications. */
export const APPROVED_SMS_PURPOSES=[
 "job.update","notification","attendance.absence","attendance.correction",
] as const;
export type ApprovedSmsPurpose=(typeof APPROVED_SMS_PURPOSES)[number];
export type ApprovedSmsTemplateRequest={
 phoneE164:string;
 dltTemplateId:string;
 senderId:string;
 purpose:ApprovedSmsPurpose;
 variables:Readonly<Record<string,string>>;
 collegeId?:string;organizationId?:string;sourceEventId?:string;
};
export type SmsDeliveryAcceptance=
 | {status:"ACCEPTED";providerSid?:string}
 | {status:"NOT_CONFIGURED";reason:string}
 | {status:"SUPPRESSED";reason:string}
 | {status:"FAILED";reason:string};
export interface ApprovedNotificationSmsProvider{
 sendSmsWithTemplate(message:ApprovedSmsTemplateRequest):Promise<SmsDeliveryAcceptance>;
 sendJobUpdateSms(message:Omit<ApprovedSmsTemplateRequest,"purpose">):Promise<SmsDeliveryAcceptance>;
 sendNotification(message:Omit<ApprovedSmsTemplateRequest,"purpose">):Promise<SmsDeliveryAcceptance>;
}

/** Legacy Java SmsService conflated OTP, job and general SMS in one bean.
 * The vNext adapter preserves named operations, but it cannot synchronously
 * block a Node.js request: every call MUST be awaited by its caller.
 * Login challenges remain valid only when sendOtp resolves true.
 * NotificationTemplateContext's Java overload is intentionally retired:
 * only preapproved templates and tenant-scoped purpose IDs may send notices. */
export type LegacyNoticeArguments = Omit<ApprovedSmsTemplateRequest,"phoneE164"|"purpose">;
export interface LegacySmsServiceAdapter {
 sendOtp(phone:string,code:string):Promise<boolean>;
 sendSmsWithTemplate(phone:string,
  message:Omit<ApprovedSmsTemplateRequest,"phoneE164">):Promise<SmsDeliveryAcceptance>;
 sendJobUpdateSms(phone:string,message:LegacyNoticeArguments):Promise<SmsDeliveryAcceptance>;
 sendNotification(phone:string,message:LegacyNoticeArguments):Promise<SmsDeliveryAcceptance>;
}

/** Normalize legacy India local/91-prefixed input at the domain boundary
 * before allowlisting, provider lookup and attempt auditing. Retain explicit
 * E.164 international destinations; never infer their dialling country. */
export function normalizeLegacySmsPhone(input:string):string|null {
 const compact=input.trim().replace(/[\s().-]/g,"");
 if(/^[6-9][0-9]{9}$/.test(compact))return "+91"+compact;
 if(/^91[6-9][0-9]{9}$/.test(compact))return "+"+compact;
 if(/^0091[6-9][0-9]{9}$/.test(compact))return "+"+compact.slice(2);
 if(/^\+[1-9][0-9]{7,14}$/.test(compact))return compact;
 return null;
}
export function createLegacySmsServiceAdapter(
 otp:SmsProvider,approved:ApprovedNotificationSmsProvider,
 otpTimeoutMs=12_000,
):LegacySmsServiceAdapter {
 const boundedTimeout=Number.isSafeInteger(otpTimeoutMs) && otpTimeoutMs>=1000 &&
  otpTimeoutMs<=30_000?otpTimeoutMs:12_000;
 async function sendOtp(phone:string,code:string):Promise<boolean>{
  const canonical=normalizeLegacySmsPhone(phone);
  if(!canonical||!/^[0-9]{4,8}$/.test(code))return false;
  return new Promise<boolean>(resolve=>{
   let settled=false;
   const timer=setTimeout(()=>{if(!settled){settled=true;resolve(false);}},boundedTimeout);
   void otp.sendOtp(canonical,code).then(accepted=>{
    if(settled)return;
    settled=true;clearTimeout(timer);resolve(accepted===true);
   },()=>{
    if(settled)return;
    settled=true;clearTimeout(timer);resolve(false);
   });
  });
 }
 function prepare(phone:string){
  return normalizeLegacySmsPhone(phone);
 }
 return {
  sendOtp,
  sendSmsWithTemplate:async(phone,message)=>{
   const phoneE164=prepare(phone);
   return phoneE164
    ? approved.sendSmsWithTemplate({...message,phoneE164})
    :{status:"SUPPRESSED",reason:"INVALID_RECIPIENT"};
  },
  sendJobUpdateSms:async(phone,message)=>{
   const phoneE164=prepare(phone);
   return phoneE164
    ? approved.sendJobUpdateSms({...message,phoneE164})
    :{status:"SUPPRESSED",reason:"INVALID_RECIPIENT"};
  },
  sendNotification:async(phone,message)=>{
   const phoneE164=prepare(phone);
   return phoneE164
    ? approved.sendNotification({...message,phoneE164})
    :{status:"SUPPRESSED",reason:"INVALID_RECIPIENT"};
  },
 };
}
