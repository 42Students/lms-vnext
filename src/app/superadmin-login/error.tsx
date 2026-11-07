"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

/** Route-local recovery does not display errors, hashes, tokens or role data. */
export default function RouteError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[color:var(--lms-neutral-50)] px-4 py-8">
      <section role="alert" className="w-full max-w-xl min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-7">
        <PageHeader title="Secure sign-in couldn't open" />
        <p className="mb-4 break-words text-sm leading-6 text-body">
          Your old bookmark now uses the secure 42LMS sign-in page.
          Try opening it again or continue directly to sign in.
        </p>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button type="button" className="min-h-11 w-full sm:w-auto" onClick={reset}>Try again</Button>
          <ButtonLink variant="secondary" className="min-h-11 w-full text-center sm:w-auto"
            href="/login?legacy=superadmin">Continue to secure sign-in</ButtonLink>
        </div>
      </section>
    </main>
  );
}
