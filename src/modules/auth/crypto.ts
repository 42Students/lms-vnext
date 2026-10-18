import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

/** Keyed HMAC-SHA256 as 64 lowercase hex characters. */
export function mac(
  secret: string,
  purpose: string,
  value: string,
) {
  return createHmac("sha256", secret)
    .update(`${purpose}\u0000${value}`)
    .digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  // HMAC digests must be canonical hex. Without format validation identical
  // malformed strings (e.g. "zz") could compare equal despite not being digests.
  if (a.length !== 64 || b.length !== 64 ||
      !/^[0-9a-f]{64}$/.test(a) || !/^[0-9a-f]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

/** Six decimal digits, uniformly distributed. */
export function generateCode() {
  return String(randomInt(100000, 1_000_000));
}

/** 256-bit opaque token, URL-safe. */
export function generateToken() {
  return randomBytes(32).toString("base64url");
}

export function codeMac(
  secret: string,
  channel: "sms" | "email",
  attemptId: string,
  code: string,
) {
  return mac(secret, `otp:${channel}:${attemptId}`, code);
}

export function contactFingerprint(
  secret: string,
  kind: "phone" | "email",
  normalized: string,
) {
  return mac(secret, `contact:${kind}`, normalized);
}

export function sessionDigest(secret: string, token: string) {
  return mac(secret, "session", token);
}

export function maskPhone(phoneE164: string) {
  const digits = phoneE164.replace(/[^0-9]/g, "");
  return digits.length <= 4
    ? "****"
    : `${"*".repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}

export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${"*".repeat(Math.max(local.length - head.length, 3))}@${domain}`;
}
