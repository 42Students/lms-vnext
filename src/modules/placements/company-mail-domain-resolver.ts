import "server-only";

import { resolve4, resolve6, resolveMx } from "node:dns/promises";

/**
 * Legacy CompanyDomainService/DnsMailDomainResolver contract. The outcome
 * describes DNS evidence only; it NEVER proves control of an email address.
 * Recruiter ownership is still established by a successfully delivered OTP.
 */
export type MailDomainAnswer = "ACCEPTS_MAIL" | "NO_MAIL" | "UNKNOWN";

const KEEP_MS = 24 * 60 * 60 * 1000;
const MAX_CACHED = 5000;
const DNS_TIMEOUT_MS = 1500;
const cached = new Map<string, { answer: Exclude<MailDomainAnswer, "UNKNOWN">; at: number }>();
const inFlight = new Map<string, Promise<MailDomainAnswer>>();

type DnsError = Error & { code?: string };
const NO_RECORD_CODES = new Set(["ENODATA", "ENOTFOUND", "ENODOMAIN", "ENOENT", "NXDOMAIN"]);

async function lookupWithTimeout<T>(lookup: () => Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      lookup(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), DNS_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    if (error instanceof Error && error.message === "DNS_TIMEOUT") throw error;
    const code = (error as DnsError | null)?.code;
    if (code && NO_RECORD_CODES.has(code)) return null;
    // Any resolver timeout, refused reply or unexpected network error is
    // UNKNOWN. Only a confirmed absence of all records becomes NO_MAIL.
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function lookupUncached(domain: string): Promise<MailDomainAnswer> {
  try {
    const mx = await lookupWithTimeout(() => resolveMx(domain));
    if (mx?.some(row => row.exchange.trim() === ".")) return "NO_MAIL";
    if (mx?.some(row => row.exchange.trim().length > 0)) return "ACCEPTS_MAIL";
    const addresses = await lookupWithTimeout(() => resolve4(domain));
    if (addresses?.length) return "ACCEPTS_MAIL";
    const ipv6 = await lookupWithTimeout(() => resolve6(domain));
    return ipv6?.length ? "ACCEPTS_MAIL" : "NO_MAIL";
  } catch {
    return "UNKNOWN";
  }
}

/** Bounded positive/negative 24h cache. UNKNOWN is never cached. */
export async function lookupCompanyMailDomain(domain: string): Promise<MailDomainAnswer> {
  const host = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!host || host.length > 253 ||
      !/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host) ||
      host.includes("..")) return "NO_MAIL";
  const hit = cached.get(host);
  const now = Date.now();
  if (hit && now - hit.at < KEEP_MS) return hit.answer;
  if (hit) cached.delete(host);
  const existing = inFlight.get(host);
  if (existing) return existing;
  const pending = lookupUncached(host).then(answer => {
    if (answer !== "UNKNOWN") {
      if (cached.size >= MAX_CACHED) cached.clear();
      cached.set(host, { answer, at: Date.now() });
    }
    return answer;
  }).finally(() => { inFlight.delete(host); });
  inFlight.set(host, pending);
  return pending;
}

/** Typed company-domain policy: requireMail=false skips DNS by contract. */
export async function companyDomainAcceptsMail(
  domain: string,
  requireMail: boolean,
): Promise<{ answer: MailDomainAnswer | "NOT_REQUIRED"; rejected: boolean }> {
  if (!requireMail) return { answer: "NOT_REQUIRED", rejected: false };
  const answer = await lookupCompanyMailDomain(domain);
  return { answer, rejected: answer === "NO_MAIL" };
}
