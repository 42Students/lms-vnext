import { outboundFetch } from "@/lib/outbound";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { getDb } from "@/db/client";
import { writeStructuredLog } from "@/observability/logger";
import type { SmsProvider } from "./types";
import { isExotelAcceptedResponse } from "@/modules/messaging/provider-acceptance-model";
import { validatedSmsAttempt } from "./sms-attempt-validation";

/**
 * Exotel transactional SMS, matching the legacy LMS integration.
 * Indian DLT rules require the registered entity, sender and template IDs;
 * a missing value fails closed instead of sending an unregistered message.
 *
 * OTP OUTAGE RECOVERY MIGRATION (G2-2-005):
 * The legacy Java TemporarySmsOutageRecovery interceptor was a development
 * testing-only bean with a hard expiry of 2026-09-28T00:00:00Z. It used the
 * APP_TEMPORARY_SMS_OUTAGE_ENABLED flag (true unless literally "false") and
 * turned SMS provider exceptions into false results. That flag, both Java
 * sendOtp overloads, and the global bean interceptor are deliberately retired:
 * no vNext caller may use an expired fallback to issue a login challenge.
 *
 * The only supported outbound OTP adapter is this DLT-registered Exotel
 * implementation, with explicit config validation. Provider false, HTTP 503,
 * timeouts, malformed JSON, and transport errors all return false. The caller
 * translates false to OTP_DELIVERY_FAILED and must not authenticate that SMS
 * code when provider acceptance was not recorded. Unexpected code errors
 * cannot be treated as delivery success. Structured logs use safe event names
 * and exception classes, never SMS values or legacy fallback warnings.
 *
 * Do not reinstate the 9999 test-code mechanism or assume a legacy test number
 * is an approved Exotel test recipient. No deployed provider policy is inferred.
 */

const OTP_SUFFIX =
  " is the One Time Password (OTP) to access your account at 42LMS.COM. " +
  "For security reasons, please do not share this OTP with anyone. -JRSPF.";

export type ExotelConfig = {
  apiKey: string;
  apiToken: string;
  accountSid: string;
  dltEntityId: string;
  otpSenderId: string;
  otpDltTemplateId: string;
  smsType: string;
};

export function readExotelConfig(
  env: Record<string, string | undefined> = process.env,
): ExotelConfig {
  return {
    apiKey: env["EXOTEL_API_KEY"] ?? "",
    apiToken: env["EXOTEL_API_TOKEN"] ?? "",
    accountSid: env["EXOTEL_ACCOUNT_SID"] ?? "42students1",
    dltEntityId: env["EXOTEL_DLT_ENTITY_ID"] ?? "1001650442971323333",
    otpSenderId: env["EXOTEL_OTP_SENDER_ID"] ?? "FLERNR",
    otpDltTemplateId:
      env["EXOTEL_OTP_DLT_TEMPLATE_ID"] ?? "1707176554481180936",
    smsType: env["EXOTEL_OTP_SMS_TYPE"] ?? "transactional_opt_in",
  };
}

/** Normalize old Indian 10-digit / 91-prefixed numbers, preserving E.164. */
export function normalizeSmsPhoneForIndia(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  if (/^[6-9][0-9]{9}$/.test(compact)) return "+91" + compact;
  if (/^91[6-9][0-9]{9}$/.test(compact)) return "+" + compact;
  return /^\+[1-9][0-9]{7,14}$/.test(compact) ? compact : null;
}

/** Provider acceptance is not handset delivery; this audit stores neither SMS
 * body, OTP, recipient address nor provider credentials. */
export const SMS_PROVIDER_ACCEPTANCE_NOTE = "Provider accepted means the SMS operator accepted the request, not that the handset received the message.";

/** Safe support copy. Never interpolate provider HTTP bodies, phone numbers or OTP. */
export const SMS_FAILURE_LABELS: Readonly<Record<string,string>> = {
 INVALID_OTP_FORMAT: "OTP code format is invalid.",
 RECIPIENT_INVALID: "Recipient number is invalid.",
 OTP_DLT_NOT_CONFIGURED: "Approved DLT registration is missing.",
 OTP_PROVIDER_NOT_CONFIGURED: "SMS provider credentials or account configuration is missing.",
 PROVIDER_HTTP_REJECTED: "SMS provider rejected the request.",
 PROVIDER_NOT_ACCEPTED: "SMS provider did not accept the request.",
 PROVIDER_UNAVAILABLE: "SMS provider was unavailable.",
};
export function normalizeSmsSupportSuffix(input: string | undefined): string {
 return (input??"").replace(/[^0-9]/g,"").slice(-4);
}
export type SmsAttemptPurpose = "otp" | "job.update" | "notification" | "attendance.absence" | "attendance.correction";
export type SmsAttemptInput = {
  purpose: SmsAttemptPurpose;
  recipient: string;
  outcome: "PROVIDER_ACCEPTED" | "FAILED";
  providerSid?: string | null;
  failureCode?: string | null;
  sourceEventId?: string | null;
  collegeId?: string | null;
  organizationId?: string | null;
};

/**
 * Shared append-only DB-031 adapter for OTP/job/attendance/notice transports.
 * Return value describes audit storage ONLY; never interpret it as send status.
 * No external send is triggered here. The schema lane owns the migration.
 */
export async function appendSmsDeliveryAttempt(input: SmsAttemptInput): Promise<"RECORDED" | "STORAGE_PENDING" | "FAILED"> {
  const attempt = validatedSmsAttempt(input);
  if (!attempt) return "FAILED";
  try {
    const db = getDb();
    // Drizzle 0162 registers this table; the retired DB-031 staging layout is
    // never a readiness signal. OTP without college membership is valid here.
    const readyResult = await db.execute(sql<{ready:boolean}>`select to_regclass('public.messaging_sms_delivery_attempts') is not null as ready`);
    if (!readyResult.rows[0]?.["ready"]) {
      writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_unavailable",
        { purpose: attempt.purpose, reason: "DB31_NOT_REGISTERED" });
      return "STORAGE_PENDING";
    }
    // 0162 registers the audit fields above; never assume the optional
    // command_id extension exists. Attempts must still be written on a
    // database with only the numbered 0162 migration applied.
    await db.execute(sql`
      insert into messaging_sms_delivery_attempts
        (organization_id, college_id, purpose, recipient_suffix, outcome,
         provider_message_id, error_code, attempted_at)
      values (${attempt.organizationId}, ${attempt.collegeId},
        ${attempt.purpose}, ${attempt.suffix}, ${attempt.outcome}, ${attempt.providerSid}, ${attempt.failureCode},
        clock_timestamp())
    `);
    return "RECORDED";
  } catch {
    writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_write_failed",
      { purpose: attempt.purpose, reason: "ATTEMPT_AUDIT_UNAVAILABLE" });
    return "FAILED";
  }
}
async function bestEffortOtpAttempt(
  phone: string, outcome: "PROVIDER_ACCEPTED" | "FAILED",
  providerSid: string | null, failureCode: string | null,
): Promise<void> {
  await appendSmsDeliveryAttempt({purpose:"otp",recipient:phone,outcome,providerSid,failureCode});
}

/** Support reads are restricted to active platform super-administrators.
 * No tenant membership or browser query can grant unscoped SMS-log access.
 * The existing /api/admin/sms-log POST endpoint projects this result without
 * accepting unredacted recipients in URLs or widening tenant access. */
export async function listSmsDeliveryAttemptsForSupport(context: RequestContext, raw: unknown) {
  if (!isSuperAdmin(context) || context.user.platformStatus !== "ACTIVE")
    throw new AuthorizationError("admin-scope.select");
  requirePermission(context,"admin-scope.select");
  if (context.adminScope?.collegeId || context.adminScope?.organizationId)
    throw new AuthorizationError("admin-scope.select");
  const query = z.strictObject({
    suffix:z.string().max(32).optional(),
    purpose:z.enum(["otp","job.update","notification","attendance.absence","attendance.correction"]).optional(),
    outcome:z.enum(["PROVIDER_ACCEPTED","FAILED"]).optional(),
    page:z.number().int().min(1).max(100000).default(1),
    size:z.number().int().min(1).max(200).default(50),
  }).parse(raw);
  const suffix=normalizeSmsSupportSuffix(query.suffix);
  const predicate = sql.join([
    sql`true`,
    ...(suffix ? [sql`recipient_suffix = ${suffix}`] : []),
    ...(query.purpose ? [sql`purpose = ${query.purpose}`] : []),
    ...(query.outcome ? [sql`outcome = ${query.outcome}`] : []),
  ],sql` and `);
  // Both the writer and privileged reader inspect the same numbered schema
  // migration table. A missing table returns an explicit retryable state.
  const ready=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.messaging_sms_delivery_attempts') is not null as ready`);
  if (!ready.rows[0]?.["ready"]) return {ready:false,entries:[],content:[],totalElements:0,totalPages:0,
    page:query.page,number:query.page-1,size:query.size,retryable:true,
    readError:"SMS_LEDGER_UNAVAILABLE",note:SMS_PROVIDER_ACCEPTANCE_NOTE};
  const total=Number((await getDb().execute(sql<{total:number}>`
    select count(*)::int as total from messaging_sms_delivery_attempts where ${predicate}`)).rows[0]?.["total"] ?? 0);
  const offset=(query.page-1)*query.size;
  const records=await getDb().execute(sql<{
    id:string;purpose:string;provider:string;recipientSuffix:string|null;collegeId:string|null;
    outcome:string;providerMessageId:string|null;safeFailureCode:string|null;createdAt:Date;
  }>`
    select id,purpose,'EXOTEL'::text as provider,
      recipient_suffix as "recipientSuffix",college_id as "collegeId",
      outcome,provider_message_id as "providerMessageId",
      error_code as "safeFailureCode",attempted_at as "createdAt"
    from messaging_sms_delivery_attempts where ${predicate}
    order by attempted_at desc,id desc limit ${query.size} offset ${offset}
  `);
  const content=records.rows.map(raw=>{
    const row=z.object({
      id:z.string(),purpose:z.string(),provider:z.string(),
      recipientSuffix:z.string().nullable(),collegeId:z.string().nullable(),
      outcome:z.string(),providerMessageId:z.string().nullable(),
      safeFailureCode:z.string().nullable(),createdAt:z.coerce.date(),
    }).parse(raw);
    return {
      id:row.id,purpose:row.purpose,provider:row.provider,
      recipientSuffix:row.recipientSuffix,collegeId:row.collegeId,
      outcome:row.outcome,providerMessageId:row.providerMessageId,
      createdAt:row.createdAt,safeFailureCode:row.safeFailureCode,
      statusLabel:row.outcome==="PROVIDER_ACCEPTED"?"Provider accepted":"Failed",
      failureSummary:row.safeFailureCode?
        SMS_FAILURE_LABELS[row.safeFailureCode]??"SMS attempt failed.":null,
    };
  });
  return {ready:true,entries:content,content,totalElements:total,
    totalPages:Math.ceil(total/query.size),page:query.page,
    number:query.page-1,size:query.size,retryable:false,readError:null,
    note:SMS_PROVIDER_ACCEPTANCE_NOTE};
}
function configured(config: ExotelConfig) {
  return Boolean(
    config.apiKey.trim() &&
      config.apiToken.trim() &&
      config.accountSid.trim() &&
      config.dltEntityId.trim() &&
      config.otpSenderId.trim() &&
      config.otpDltTemplateId.trim(),
  );
}

export function createExotelSmsProvider(
  config: ExotelConfig = readExotelConfig(),
  fetchImpl: typeof fetch = fetch,
): SmsProvider {
  return {
    async sendOtp(phoneE164, code) {
      const canonicalPhone = normalizeSmsPhoneForIndia(phoneE164);
      if (!/^[0-9]{4,8}$/.test(code)) {
        writeStructuredLog("WARNING", "sms.otp_rejected", {
          reason: "invalid_code_format",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, "INVALID_OTP_FORMAT");
        return false;
      }

      const configFailure = !canonicalPhone?"RECIPIENT_INVALID":
        !config.dltEntityId.trim()||!config.otpDltTemplateId.trim()||!config.otpSenderId.trim()
          ?"OTP_DLT_NOT_CONFIGURED":
        !configured(config)||!/^[A-Za-z0-9_-]+$/.test(config.accountSid)
          ?"OTP_PROVIDER_NOT_CONFIGURED":null;
      if(configFailure){
        writeStructuredLog("WARNING","sms.otp_not_sent",{reason:configFailure});
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, configFailure);
        return false;
      }

      const form = new URLSearchParams({
        From: config.otpSenderId,
        To: canonicalPhone!,
        Body: `${code}${OTP_SUFFIX}`,
        DltEntityId: config.dltEntityId,
        DltTemplateId: config.otpDltTemplateId,
        SmsType: config.smsType,
        Priority: "high",
      });

      try {
        const response = await outboundFetch(
          // The ".json" suffix selects JSON; without it Exotel answers XML.
          `https://api.exotel.com/v1/Accounts/${config.accountSid}/Sms/send.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${config.apiKey}:${config.apiToken}`,
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: form,
            timeoutMs: 10_000,
            maxAttempts: 1, // OTP POST has no provider idempotency guarantee.
            fetchImpl,
          },
        );

        if (!response.ok) {
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            httpStatus: response.status,
          });
          await bestEffortOtpAttempt(canonicalPhone!, "FAILED", null, "PROVIDER_HTTP_REJECTED");
          return false;
        }

        const body = (await response.json()) as {
          SMSMessage?: { Sid?: string; Status?: string };
        };
        const accepted = isExotelAcceptedResponse(body);
        const status = (body.SMSMessage?.Status ?? "").trim().toLowerCase();
        if (!accepted) {
          // Provider status is untrusted text. Do not echo arbitrary API
          // strings into audit logs: they could include an OTP or recipient.
          const safeStatus = ["failed", "rejected", "invalid", "cancelled",
            "canceled", "undelivered"].includes(status)
            ? status : "UNRECOGNIZED";
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            providerStatus: safeStatus,
          });
          await bestEffortOtpAttempt(canonicalPhone!, "FAILED", null, "PROVIDER_NOT_ACCEPTED");
          return false;
        }

        // Provider acceptance is not proof of handset delivery.
        writeStructuredLog("INFO", "sms.otp_accepted", {
          providerStatus: status,
        });
        await bestEffortOtpAttempt(canonicalPhone!, "PROVIDER_ACCEPTED",
          body.SMSMessage?.Sid ?? null, null);
        return true;
      } catch (error) {
        // Never log the URL, credentials, phone, code or response body.
        writeStructuredLog("WARNING", "sms.otp_request_failed", {
          errorType:error instanceof Error && ["TypeError","AbortError","TimeoutError","SyntaxError"].includes(error.name)
            ? error.name : "ProviderError",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, "PROVIDER_UNAVAILABLE");
        return false;
      }
    },
  };
}
