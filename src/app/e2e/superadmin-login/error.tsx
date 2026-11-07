"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

/** A retired E2E bookmark never prints exception details or reauthenticates itself. */
export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <main className="flex min-h-dvh min-w-0 items-center justify-center bg-[color:var(--lms-neutral-50)] px-4 py-8">
    <section role="alert" className="w-full max-w-xl min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-7">
      <PageHeader title="This old test sign-in link couldn't open" />
      <p className="text-sm leading-6 text-body">Test sign-in links are retired. Retry this page or use the normal secure sign-in.</p>
      <nav aria-label="Recovery actions" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Try again</Button>
        <ButtonLink variant="secondary" href="/login" className="min-h-11 w-full sm:w-auto">Secure sign-in</ButtonLink>
      </nav>
    </section>
  </main>;
}
