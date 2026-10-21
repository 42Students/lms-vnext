// Auth check for Next.js API routes (src/pages/api/**). The edge middleware (src/proxy.js) only
// gates page navigations under PROTECTED_PREFIXES — everything under /api is explicitly public
// there (PUBLIC_PREFIXES includes "/api"), so an API route that calls a paid third-party service
// (e.g. OpenAI) must check auth itself or it's reachable by anyone who finds the URL.
//
// BE-0188: this server can't check the JWT signature (the key lives only in the backend), and decoding the
// payload proves nothing: anyone can write a three-part cookie with any claims. So the caller's cookie is
// forwarded to the backend, whose filter chain verifies it (signature, expiry, token version) and answers
// for the AI-grading feature: staff only, with a daily allowance (BE-0189).
import { API_URL } from "@/config/appConfig";

const ACCESS_TIMEOUT_MS = 5000;

function backendUrl() {
  // A server-only override lets a deployment use an in-cluster address; otherwise the public backend URL.
  return String(process.env.LMS_INTERNAL_API_URL || API_URL || "").replace(/\/+$/, "");
}

/**
 * Asks the backend whether this request's session may use AI grading.
 * `use: true` also spends one of today's gradings, so send it only right before the paid work.
 * Resolves to { ok: true, user } or { ok: false, status, error }; never throws.
 */
export async function verifyAiGradingAccess(req, { use = false } = {}) {
  const token = req?.cookies?.lms_authenticated;
  if (!token || typeof token !== "string" || token.split(".").length !== 3) {
    return { ok: false, status: 401, error: "Authentication required." };
  }
  const base = backendUrl();
  if (!base) return { ok: false, status: 503, error: "Sign-in can't be checked right now." };
  try {
    const response = await fetch(`${base}/api/v1/auth/ai-grading-access${use ? "?use=true" : ""}`, {
      method: "GET",
      headers: { Cookie: `lms_authenticated=${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(ACCESS_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return { ok: true, user: data };
    if (response.status === 401) return { ok: false, status: 401, error: "Authentication required." };
    if (response.status === 403) return { ok: false, status: 403, error: data?.error || "AI grading is for faculty and admins." };
    if (response.status === 429) return { ok: false, status: 429, error: data?.error || "Today's AI grading allowance is used up." };
    return { ok: false, status: 503, error: "Sign-in can't be checked right now. Try again in a minute." };
  } catch {
    // Fail closed: if the backend can't vouch for the session, nothing paid runs.
    return { ok: false, status: 503, error: "Sign-in can't be checked right now. Try again in a minute." };
  }
}
