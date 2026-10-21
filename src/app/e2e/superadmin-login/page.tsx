import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

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
  const providedPhone = typeof raw.phone === "string" && raw.phone.trim().length > 0;
  return <main className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
    <PageHeader title="E2E Superadmin Login" />
    <section className="space-y-4 border border-border bg-surface p-5 text-sm text-body"
      role="status" aria-live="polite">
      <h2 className="text-lg font-semibold text-primary-text">Test login link retired</h2>
      <p>This link no longer creates a Super Admin session. Sign in using the
        normal secure login and select an authorized workspace. No test account
        or privileged identity can be created from this page.</p>
      {!providedPhone ? <p className="font-semibold">Missing phone</p> : null}
      <p>If your test environment is unavailable or sign-in fails, check your
        development fixture setup or contact your administrator. No access was granted.</p>
      <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4">
        Continue to secure sign-in
      </Link>
    </section>
  </main>;
}
