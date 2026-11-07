"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

/**
 * UX-G124: keep the email-proof bearer exclusively in the URL fragment and
 * transient component state. A confirmed user action is required to redeem it.
 * No token ever enters a URL query, persisted storage, analytics or rendered DOM.
 */
export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "sending" | "done" | "invalid">("loading");
  const submitting = useRef(false);
  // React Strict Mode replays mount effects in development. Do not consume a
  // one-time fragment twice: the second pass would see the stripped URL and
  // incorrectly replace a valid link with an invalid-link state.
  const processedLink = useRef(false);

  useEffect(() => {
    if (processedLink.current) return;
    processedLink.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const value = hash.get("token") ?? "";
    // Strip the bearer before exposing links or any user interaction.
    window.history.replaceState(null, "", window.location.pathname);
    if (/^[a-zA-Z0-9_-]{43}$/.test(value)) {
      setToken(value);
      setState("ready");
    } else {
      setState("invalid");
    }
  }, []);

  async function confirm() {
    if (state !== "ready" || !token || submitting.current) return;
    submitting.current = true;
    setState("sending");
    try {
      const result = await fetch("/api/auth/email-ownership/redeem", {
        method: "POST",
        credentials:"same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache:"no-store",
        redirect: "error",
      });
      const data: unknown = await result.json();
      const success = result.ok && typeof data === "object" && data !== null &&
        "verified" in data && (data as { verified: unknown }).verified === true;
      setState(success ? "done" : "invalid");
    } catch {
      setState("invalid");
    } finally {
      setToken("");
      submitting.current = false;
    }
  }

  return (
    <main className="flex min-h-dvh min-w-0 items-center justify-center bg-[var(--lms-neutral-100)] px-4 py-10 sm:px-6">
      <section aria-labelledby="verify-email-title" className="w-full max-w-lg space-y-5 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 shadow-sm sm:p-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
            Account verification
          </p>
          <Heading level={1} size="2xl" id="verify-email-title">
            Verify your email
          </Heading>
        </header>

        {state === "loading" ? (
          <p role="status" aria-live="polite" className="text-sm leading-6 text-body">
            Checking your verification link…
          </p>
        ) : null}

        {state === "ready" ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-body">
              Confirm that this email address belongs to your signed-in college account.
            </p>
            <p className="rounded-lg border border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-6 text-body">
              This link expires after 24 hours and can be used only once. Make sure you're signed in to the correct college account.
            </p>
            <Button type="button" onClick={() => void confirm()} className="min-h-11 w-full">
              Confirm email ownership
            </Button>
          </div>
        ) : null}

        {state === "sending" ? (
          <p role="status" aria-live="polite" className="rounded-lg bg-primary-subtle px-4 py-3 text-sm leading-6 text-body">
            Verifying your email address…
          </p>
        ) : null}

        {state === "done" ? (
          <p role="status" aria-live="polite" className="rounded-lg border border-border bg-primary-subtle px-4 py-3 text-sm leading-6 text-body">
            Email ownership verified. You may return to your account.
          </p>
        ) : null}

        {state === "invalid" ? (
          <p role="alert" className="rounded-lg border border-border bg-[var(--lms-neutral-50)] px-4 py-3 text-sm leading-6 text-body">
            This link is invalid, expired or unavailable for the current account. Sign in to the correct college workspace and request another link.
          </p>
        ) : null}

        {state !== "loading" && state !== "sending" ? (
          <div className="border-t border-border pt-4">
            <TextLink href={state === "done" ? "/dashboard" : "/login"}
              className="inline-flex min-h-11 items-center text-sm">
              {state === "done" ? "Return to my workspace" : "Back to sign in"}
            </TextLink>
          </div>
        ) : null}
      </section>
    </main>
  );
}
