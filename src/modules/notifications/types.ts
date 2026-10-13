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
