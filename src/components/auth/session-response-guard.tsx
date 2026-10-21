"use client";

import { useEffect } from "react";
import { sessionExpiredHref } from "@/lib/return-to";

/**
 * vNext uses first-party opaque device sessions, not refresh tokens. A stale
 * long-running browser tab must recover once instead of repeating failed API
 * mutations; the server layout also redirects when a new navigation occurs.
 */
export function SessionResponseGuard() {
  useEffect(() => {
    const original = window.fetch;
    let redirected = false;
    const guarded: typeof fetch = async (input, init) => {
      const response = await original(input, init);
      if (redirected || (response.status !== 401 && response.status !== 403)) return response;
      const url = input instanceof Request ? input.url : String(input);
      let requestUrl: URL;
      try { requestUrl = new URL(url, window.location.href); }
      catch { return response; }
      if (requestUrl.origin !== window.location.origin ||
          !requestUrl.pathname.startsWith("/api/") ||
          requestUrl.pathname.startsWith("/api/auth/")) return response;
      let reason: string | undefined;
      try { reason = (await response.clone().json() as {error?: string}).error; }
      catch { /* Original response body stays available for the caller. */ }
      if(response.status===403){
        window.dispatchEvent(new Event("lms:access-denied"));
      }
      const method=(init?.method??(input instanceof Request?input.method:"GET")).toUpperCase();
      if(method!=="GET"&&method!=="HEAD"){
        // The mutation caller still receives the exact response; this event
        // only offers a consistent way to refresh optimistic UI on auth loss.
        window.dispatchEvent(new CustomEvent("lms:mutation-access-lost",{
          detail:{status:response.status,reason:reason??null}
        }));
      }
      if (response.status === 401 || reason === "SESSION_EXPIRED" || reason === "SESSION_REVOKED") {
        redirected = true;
        // The root sign-in page renders the session-expiry explanation from
        // the validated auth=expired/revoked flag. Replace avoids Back loops.
        window.location.replace(sessionExpiredHref(
          window.location.pathname + window.location.search,
          reason === "SESSION_REVOKED" ? "revoked" : "expired",
        ));
      }
      return response;
    };
    window.fetch = guarded;
    return () => { if (window.fetch === guarded) window.fetch = original; };
  }, []);
  return null;
}
