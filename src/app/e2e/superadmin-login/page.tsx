import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";

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
  const providedPhone = typeof raw.phone === "string" && raw.phone.trim().length > 0;
  let devVerifiedSuperAdmin = false;
  if (process.env.NODE_ENV === "development" && process.env.E2E_AUTH_ENABLED === "true") {
    try {
      devVerifiedSuperAdmin = isSuperAdmin(await getCurrentRequestContext());
    } catch {
      devVerifiedSuperAdmin = false;
    }
  }
  return <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
    <PageHeader title="E2E Superadmin Login" />
    <section className="space-y-4 border border-border bg-surface p-5 text-sm text-body"
      role="status" aria-live="polite">
      <h2 className="text-lg font-semibold text-primary-text">
        Deprecated E2E login link — restricted development setup
      </h2>
      <p>This link no longer creates a Super Admin session. Sign in using the
        normal secure login and select an authorized workspace. No test account
        or privileged identity can be created from this page.</p>
      {!providedPhone ? <p className="font-semibold">Missing phone parameter (legacy test link only).</p> : null}
      {devVerifiedSuperAdmin ? <p className="rounded-md border border-border p-3">
        A signed-in, active global Super Admin was verified in development.
        The legacy phone link did not grant this access.
        <Link href="/dashboard" className="ml-2 font-semibold text-link underline underline-offset-4">
          Open authorized dashboard
        </Link>
      </p> : null}
      <p>Test fixtures must be provisioned through an authenticated development
        setup, not a public login bypass. If fixture setup or sign-in fails, review
        the development configuration and try the secure login below.
        This page never creates a test account or grants access.</p>
      <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
        Continue to secure sign-in
      </Link>
    </section>
  </main>;
}
