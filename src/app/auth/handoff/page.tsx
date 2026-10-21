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
  // A retired handoff must never redeem the supplied token, read its
  // destination from localStorage, or forward arbitrary query parameters
  // (including nested auth/code/session secrets) to a subsequent URL.
  const safeTarget = target && !target.startsWith("/auth/handoff") &&
    !target.startsWith("/auth/") ? new URL(target, "https://lms.invalid") : null;
  const permitted = new Set(["tab", "view", "page", "month",
    "deliveryId", "courseId", "sectionId"]);
  const retained = new URLSearchParams();
  safeTarget?.searchParams.forEach((value,key)=>{
    if(permitted.has(key) && value.length <= 120)retained.set(key,value);
  });
  const returnTo = safeTarget ? safeTarget.pathname +
    (retained.size ? "?" + retained.toString() : "") : null;
  // The canonical sign-in screen shows the explicit retired-link warning
  // while keeping credentials out of browser history and out of referrers.
  redirect("/login?auth=handoff-retired" +
    (returnTo ? "&returnTo=" + encodeURIComponent(returnTo) : ""));
}
