import { API_URL } from "@/config/appConfig";

const MOBILE_AUTH_TIMEOUT_MS = 20000;

async function mobileAuthFetch(path, body) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort(), MOBILE_AUTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...(controller ? { signal: controller.signal } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.message || data?.error || "MOBILE_AUTH_FAILED");
      err.code = data?.error || "MOBILE_AUTH_FAILED";
      throw err;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const err = new Error("The login request timed out. Please try again.");
      err.code = "MOBILE_AUTH_TIMEOUT";
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function mobileAuthStart(phone) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/start", { phone });
}

/** key: the chosen account's stable key from the list; the server prefers it to choiceId (a position in the list). */
export async function mobileAuthSend(phone, choiceId, key) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/send", key ? { phone, choiceId, key } : { phone, choiceId });
}

export async function mobileAuthVerify(attemptId, otp) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/verify", { attemptId, otp });
}

export async function mobileAuthEmailFallbackSend(attemptId) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/email-fallback/send", { attemptId });
}

/** recruiter V1 §10/§2: "Recruiter? Sign in with email." Starts an attempt from an email alone, no phone step. Verify it the same way as any other email-channel attempt, with mobileAuthEmailFallbackVerify. */
export async function recruiterEmailLoginStart(email) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/recruiter/email-login/start", { email });
}

/** Sign in with an email (students, staff and recruiters). Returns EMAIL_OTP_SENT, or CHOOSE_ACCOUNT when the email is in more than one place. */
export async function emailLoginStart(email) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/email-login/start", { email });
}

/** After CHOOSE_ACCOUNT: send the email code for the chosen account. */
export async function emailLoginSend(email, choiceId, key) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/email-login/send", key ? { email, choiceId, key } : { email, choiceId });
}

export async function mobileAuthEmailFallbackVerify(attemptId, otp) {
  return mobileAuthFetch("/api/v1/public/mobile-auth/email-fallback/verify", { attemptId, otp });
}
