"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Invite = {
  collegeName: string;
  companyName: string | null;
  contactName: string;
  designation: string | null;
  expiresAt: string;
};
type State = "loading" | "ready" | "invalid" | "declined";

const button =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";
const primary = button + " bg-primary text-on-primary";
const secondary = button + " bg-surface text-foreground hover:bg-surface-secondary";

export function RecruiterInviteLanding({ token }: { token: string }) {
  const [state, setState] = useState<State>("loading");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/recruiter-invite/" + encodeURIComponent(token), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async response => {
        const data = await response.json() as {
          invite?: Invite;
          error?: string;
        };
        if (!response.ok || !data.invite) {
          setState("invalid");
          return;
        }
        setInvite(data.invite);
        setState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("invalid");
      });
    return () => controller.abort();
  }, [token]);

  async function answer(kind: "not-hiring" | "unsubscribe") {
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch(
        "/api/public/recruiter-invite/" +
          encodeURIComponent(token) +
          "/" +
          kind,
        { method: "POST", credentials: "same-origin" },
      );
      if (!response.ok) {
        if (response.status === 404) {
          setState("invalid");
          return;
        }
        throw new Error("request failed");
      }
      setState("declined");
    } catch {
      setActionError("That did not work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main className="flex min-h-screen items-center justify-center bg-surface-secondary p-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
        {children}
      </section>
    </main>
  );

  if (state === "loading") {
    return shell(
      <div role="status" className="space-y-3">
        <div className="h-7 w-3/4 animate-pulse rounded bg-border" />
        <div className="h-4 w-full animate-pulse rounded bg-border" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-border" />
      </div>,
    );
  }

  if (state === "invalid" || !invite) {
    return shell(
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">This link is no longer valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have expired or already been used. Ask the placement cell to send you a new one.
        </p>
      </div>,
    );
  }

  if (state === "declined") {
    return shell(
      <div className="text-center">
        <h1 className="text-xl font-semibold text-foreground">Thank you, we have told the placement cell</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your response has been recorded and this invitation link can no longer be used.
        </p>
      </div>,
    );
  }

  return shell(
    <>
      <h1 className="text-xl font-semibold text-foreground">
        {invite.collegeName} would like you to hire from their students
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {invite.companyName ? "You are joining as " + invite.companyName + ". " : ""}
        You will see student numbers by branch and can request a placement drive.
        Names and contact details are shared only through the placement workflow.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-surface-secondary p-4 text-sm">
        <p><strong>Contact:</strong> {invite.contactName}</p>
        {invite.designation ? <p><strong>Designation:</strong> {invite.designation}</p> : null}
      </div>

      <div className="mt-5">
        <button className={primary} disabled aria-disabled="true">
          Join
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Account activation is temporarily unavailable until the shared Identity Platform
          and pending-college-consent migration are verified. Opening this page does not
          consume your invitation.
        </p>
      </div>

      {actionError ? <p role="alert" className="mt-4 text-sm text-destructive">{actionError}</p> : null}

      <div className="mt-5 space-y-2">
        <button className={secondary} disabled={busy} onClick={() => void answer("not-hiring")}>
          Not hiring from this college this season
        </button>
        <button className={secondary} disabled={busy} onClick={() => void answer("unsubscribe")}>
          Stop contacting me
        </button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account? <Link className="text-primary-text hover:underline" href="/login">Sign in</Link>
      </p>
    </>,
  );
}
