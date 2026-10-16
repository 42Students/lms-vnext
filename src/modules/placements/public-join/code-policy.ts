import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  publicCollegeJoinTokenSchema, publicRecruiterWorkEmailSchema,
} from "../public-college-join-model";

export const PUBLIC_JOIN_CODE_TTL_MS = 10 * 60_000;
export const PUBLIC_JOIN_PER_EMAIL_HOUR = 5;
export const PUBLIC_JOIN_PER_LINK_HOUR = 300;
export const PUBLIC_JOIN_PER_IP_SEND_HOUR = 20;
export const PUBLIC_JOIN_PER_IP_JOIN_HOUR = 30;
export const PUBLIC_JOIN_MAX_FAILURES = 5;

export const publicJoinSendCodeSchema = z.strictObject({
  token: publicCollegeJoinTokenSchema,
  email: publicRecruiterWorkEmailSchema,
});

export function publicJoinCodeSendAllowed(input: {
  emailHour: number; linkHour: number; networkHour: number;
}) {
  return Number.isSafeInteger(input.emailHour) && input.emailHour >= 0 &&
    input.emailHour < PUBLIC_JOIN_PER_EMAIL_HOUR &&
    Number.isSafeInteger(input.linkHour) && input.linkHour >= 0 &&
    input.linkHour < PUBLIC_JOIN_PER_LINK_HOUR &&
    Number.isSafeInteger(input.networkHour) && input.networkHour >= 0 &&
    input.networkHour < PUBLIC_JOIN_PER_IP_SEND_HOUR;
}

export function newPublicJoinCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function publicJoinCodeDigest(
  linkId: string, email: string, code: string, secret: string,
) {
  if (Buffer.byteLength(secret, "utf8") < 32 ||
      !/^[0-9]{6}$/.test(code) || !z.string().uuid().safeParse(linkId).success) {
    throw new Error("PUBLIC_JOIN_CODE_CONFIG_INVALID");
  }
  return createHmac("sha256", secret)
    .update("public-join-code-v1:")
    .update(linkId).update(":").update(email).update(":").update(code)
    .digest("hex");
}

export function matchesPublicJoinCode(
  stored: string, linkId: string, email: string, code: string, secret: string,
) {
  if (!/^[a-f0-9]{64}$/.test(stored) || !/^[0-9]{6}$/.test(code)) return false;
  const fresh = publicJoinCodeDigest(linkId, email, code, secret);
  return timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(fresh, "hex"));
}
