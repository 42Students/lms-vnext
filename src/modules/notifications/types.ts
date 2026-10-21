/**
 * Delivery ports. Domain code depends on these interfaces only, so tests use
 * in-memory fakes and no test can ever send a real SMS or email.
 */

export interface SmsProvider {
  /** Resolves true only when the provider ACCEPTED the message. */
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
