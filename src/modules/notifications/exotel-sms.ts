import { outboundFetch } from "@/lib/outbound";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, requirePermission } from "@/modules/permissions/policy";
import { getDb } from "@/db/client";
import { writeStructuredLog } from "@/observability/logger";
import type { SmsProvider } from "./types";
import { isExotelAcceptedResponse } from "@/modules/messaging/provider-acceptance-model";

/**
 * Exotel transactional SMS, matching the legacy LMS integration.
 * Indian DLT rules require the registered entity, sender and template IDs;
 * a missing value fails closed instead of sending an unregistered message.
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
    apiKey: env.EXOTEL_API_KEY ?? "",
    apiToken: env.EXOTEL_API_TOKEN ?? "",
    accountSid: env.EXOTEL_ACCOUNT_SID ?? "42students1",
    dltEntityId: env.EXOTEL_DLT_ENTITY_ID ?? "1001650442971323333",
    otpSenderId: env.EXOTEL_OTP_SENDER_ID ?? "FLERNR",
    otpDltTemplateId:
      env.EXOTEL_OTP_DLT_TEMPLATE_ID ?? "1707176554481180936",
    smsType: env.EXOTEL_OTP_SMS_TYPE ?? "transactional_opt_in",
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
export const SMS_PROVIDER_ACCEPTANCE_NOTE = "SENT means the SMS operator accepted the request, not that the handset received the message.";
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
const smsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Shared append-only DB-031 adapter for OTP/job/attendance/notice transports.
 * Return value describes audit storage ONLY; never interpret it as send status.
 * No external send is triggered here. The schema lane owns the migration.
 */
export async function appendSmsDeliveryAttempt(input: SmsAttemptInput): Promise<"RECORDED" | "STORAGE_PENDING" | "FAILED"> {
  const suffix = input.recipient.replace(/[^0-9]/g, "").slice(-4) || null;
  const code = input.failureCode ?? null;
  const sid = input.providerSid ?? null;
  const pairIsPresent = Boolean(input.collegeId) === Boolean(input.organizationId);
  const validIds = (!input.collegeId || smsUuid.test(input.collegeId)) &&
    (!input.organizationId || smsUuid.test(input.organizationId)) &&
    (!input.sourceEventId || smsUuid.test(input.sourceEventId));
  const validResult = input.outcome === "PROVIDER_ACCEPTED"
    ? Boolean(sid && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(sid) && !code)
    : Boolean(code && /^[A-Z0-9_.:-]{1,40}$/.test(code) && !sid);
  if (!pairIsPresent || !validIds || !validResult) return "FAILED";
  try {
    const db = getDb();
    const readyResult = await db.execute(sql<{ready:boolean}>`select to_regclass('public.sms_delivery_attempts') is not null as ready`);
    if (!readyResult.rows[0]?.ready) {
      writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_unavailable",
        { purpose: input.purpose, reason: "DB31_NOT_REGISTERED" });
      return "STORAGE_PENDING";
    }
    await db.execute(sql`
      insert into sms_delivery_attempts
        (organization_id, college_id, purpose, provider, recipient_suffix, outcome,
         provider_message_id, safe_failure_code, source_event_id, provider_accepted_at)
      values (${input.organizationId ?? null}, ${input.collegeId ?? null},
        ${input.purpose}, 'EXOTEL', ${suffix}, ${input.outcome}, ${sid}, ${code},
        ${input.sourceEventId ?? null},
        ${input.outcome === "PROVIDER_ACCEPTED" ? new Date() : null})
    `);
    return "RECORDED";
  } catch {
    writeStructuredLog("WARNING", "sms.delivery_attempt_ledger_write_failed",
      { purpose: input.purpose, reason: "ATTEMPT_AUDIT_UNAVAILABLE" });
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
 * The read endpoint/UI still needs to be wired by its own owning lane. */
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
    size:z.number().int().min(1).max(100).default(25),
  }).parse(raw);
  const suffix=(query.suffix ?? "").replace(/[^0-9]/g, "").slice(-4);
  const predicate = sql.join([
    sql`true`,
    ...(suffix ? [sql`recipient_suffix = ${suffix}`] : []),
    ...(query.purpose ? [sql`purpose = ${query.purpose}`] : []),
    ...(query.outcome ? [sql`outcome = ${query.outcome}`] : []),
  ],sql` and `);
  const ready=await getDb().execute(sql<{ready:boolean}>`select to_regclass('public.sms_delivery_attempts') is not null as ready`);
  if (!ready.rows[0]?.ready) return {ready:false,entries:[],totalElements:0,totalPages:0,page:query.page,
    note:SMS_PROVIDER_ACCEPTANCE_NOTE};
  const [{total}] = (await getDb().execute(sql<{total:number}>`
    select count(*)::int as total from sms_delivery_attempts where ${predicate}`)).rows;
  const offset=(query.page-1)*query.size;
  const records=await getDb().execute(sql<{
    id:string;purpose:string;provider:string;recipientSuffix:string|null;
    outcome:string;providerMessageId:string|null;safeFailureCode:string|null;createdAt:Date;
  }>`
    select id,purpose,provider,recipient_suffix as "recipientSuffix",
      outcome,provider_message_id as "providerMessageId",
      safe_failure_code as "safeFailureCode",created_at as "createdAt"
    from sms_delivery_attempts where ${predicate}
    order by created_at desc,id desc limit ${query.size} offset ${offset}
  `);
  return {ready:true,entries:records.rows,totalElements:total??0,
    totalPages:Math.ceil((total??0)/query.size),page:query.page,note:SMS_PROVIDER_ACCEPTANCE_NOTE};
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

      if (
        !configured(config) ||
        !/^[A-Za-z0-9_-]+$/.test(config.accountSid) ||
        !canonicalPhone
      ) {
        writeStructuredLog("WARNING", "sms.otp_not_sent", {
          reason: "configuration_or_recipient_invalid",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null,
          canonicalPhone ? "OTP_PROVIDER_NOT_CONFIGURED" : "RECIPIENT_INVALID");
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
          writeStructuredLog("WARNING", "sms.otp_not_accepted", {
            providerStatus: status.slice(0, 32),
          });
          await bestEffortOtpAttempt(canonicalPhone!, "FAILED", null, "PROVIDER_NOT_ACCEPTED");
          return false;
        }

        // Provider acceptance is not proof of handset delivery.
        writeStructuredLog("INFO", "sms.otp_accepted", {
          providerStatus: status,
          recipientSuffix: canonicalPhone!.slice(-4),
        });
        await bestEffortOtpAttempt(canonicalPhone!, "PROVIDER_ACCEPTED",
          body.SMSMessage?.Sid ?? null, null);
        return true;
      } catch (error) {
        // Never log the URL, credentials, phone, code or response body.
        writeStructuredLog("WARNING", "sms.otp_request_failed", {
          errorType:
            error instanceof Error ? error.name : "UnknownError",
        });
        await bestEffortOtpAttempt(canonicalPhone ?? "", "FAILED", null, "PROVIDER_UNAVAILABLE");
        return false;
      }
    },
  };
}
