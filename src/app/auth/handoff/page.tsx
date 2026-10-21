import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/return-to";

/**
 * Legacy handoff tokens could carry credentials between unrelated domains.
 * Never read, validate, log, set cookies from, or forward old handoff tokens.
 * The target host must establish its own OTP session. Only a local safe
 * return path may survive this first-party reauthentication boundary.
 */
export default async function RetiredHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    returnTo?: string | string[];
    token?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const requested = typeof params.returnTo === "string"
    ? params.returnTo
    : typeof params.next === "string" ? params.next : null;
  const target = safeReturnTo(requested);
  // Discard recursive handoff URLs and any legacy token, even when present.
  const returnTo = target && !target.startsWith("/auth/handoff") ? target : null;
  redirect("/login?auth=handoff-retired" +
    (returnTo ? "&returnTo=" + encodeURIComponent(returnTo) : ""));
}
