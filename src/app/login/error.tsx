"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { ButtonLink } from "@/components/ui/button-link";

/** A recoverable sign-in error keeps the shared error reporting and safe copy,
 * but gives visitors a direct new OTP entry rather than the marketing root. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh min-w-0 items-center justify-center bg-[color:var(--lms-neutral-50)] px-4 py-8">
      <section aria-label="Sign-in recovery"
        className="w-full min-w-0 max-w-xl space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-7">
        <GracefulErrorBoundary error={error} reset={reset} homeHref="/home" insideShell />
        <ButtonLink variant="secondary" href="/login"
          className="min-h-11 w-full justify-center text-center sm:w-auto md:min-h-9">
          Start a fresh secure sign-in
        </ButtonLink>
      </section>
    </main>
  );
}
