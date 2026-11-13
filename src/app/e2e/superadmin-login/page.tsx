import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

import { featureReady } from "@/config/features";
export const metadata: Metadata = {
  title: "Retired test sign-in · 42 LMS",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

/**
 * Retired public E2E login deep link. Do not accept a phone number here or
 * mint a session. The separate dev-only seed API requires an authenticated
 * global Super Admin, signed session, same-origin and independent secret.
 */
export default async function LegacySuperAdminE2ELoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  // Retain the bookmark for legacy test harnesses without allowing a phone
  // query parameter to authorize or construct a session.
  const providedPhone = typeof raw["phone"] === "string" && raw["phone"].trim().length > 0;
  let devVerifiedSuperAdmin = false;
  if (process.env.NODE_ENV === "development" && featureReady("e2eAuth")) {
    try {
      devVerifiedSuperAdmin = isSuperAdmin(await getCurrentRequestContext());
    } catch {
      devVerifiedSuperAdmin = false;
    }
  }
  return <main className="flex min-h-dvh min-w-0 items-center justify-center bg-[color:var(--lms-neutral-50)] px-4 py-8 sm:py-12">
    <div className="w-full max-w-xl min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-7">
    <PageHeader title="E2E Superadmin Login" />
    <section className="min-w-0 space-y-4 text-sm text-body"
      role="status" aria-live="polite">
      <Heading level={2} size="lg" className="text-primary-text">
        Deprecated E2E login link — restricted development setup
      </Heading>
      <p>This link no longer creates a Super Admin session. Sign in using the
        normal secure login and select an authorized workspace. No test account
        or privileged identity can be created from this page.</p>
      {!providedPhone ? <p className="font-semibold">Missing phone parameter (legacy test link only).</p> : null}
      {devVerifiedSuperAdmin ? <p className="rounded-md border border-border p-3">
        A signed-in, active global Super Admin was verified in development.
        The legacy phone link did not grant this access.
        <TextLink href="/dashboard" className="ml-2">
          Open authorized dashboard
        </TextLink>
      </p> : null}
      <p>Test fixtures must be provisioned through an authenticated development
        setup, not a public login bypass. If fixture setup or sign-in fails, review
        the development configuration and try the secure login below.
        This page never creates a test account or grants access.</p>
      <nav aria-label="Next steps" className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <ButtonLink variant="primary" href="/login" className="min-h-11 w-full sm:w-auto">
          Continue to secure sign-in
        </ButtonLink>
        <ButtonLink variant="secondary" href="/home" className="min-h-11 w-full sm:w-auto">
          Back to home
        </ButtonLink>
      </nav>
    </section>
    </div>
  </main>;
}
