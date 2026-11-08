"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import authStyles from "@/components/public/public-auth-skin.module.css";

/** A single public landmark and contextual heading; shared telemetry/retry stays intact. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <main className={`${authStyles["page"]} flex min-w-0 items-center justify-center px-4 pb-8 pt-24 md:py-12`}>
    <Card as="section" className="w-full max-w-xl">
      <PageHeader title="This sign-in link may have expired" />
      <p className="mb-4 break-words text-sm leading-6 text-[var(--lms-body-text)]">
        For your security, sign-in links work only once. Start a new sign-in from your college or platform login page.
      </p>
      <GracefulErrorBoundary error={error} reset={reset}
        homeHref="/?auth=handoff-retired" insideShell showHeader={false} />
    </Card>
  </main>;
}
