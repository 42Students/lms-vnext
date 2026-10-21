import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default async function Unsubscribed({
  searchParams,
}: { searchParams: Promise<{ scope?: string }> }) {
  const cell = (await searchParams).scope === "placement-cell";
  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 flex-col justify-center gap-4 px-4 pb-8 pt-24 min-[768px]:py-12`}>
      <Card as="section">
       <div className="flex min-w-0 flex-col items-center gap-4 py-4 text-center">
        <svg aria-hidden="true" viewBox="0 0 64 64" width="64" height="64" fill="none"
          className="shrink-0 text-[var(--lms-success-text)]">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3"/>
          <path d="M19 32.5 28 41l18-19" stroke="currentColor" strokeLinecap="round"
            strokeLinejoin="round" strokeWidth="4"/>
        </svg>
      <PageHeader title={cell ? "You're unsubscribed" : "Email preference updated"} />
        <p role="status" aria-live="polite" className="max-w-prose break-words text-base leading-6 text-body">
          {cell
            ? "This placement cell will not email you again."
            : "Your address has been suppressed from campaign email. Transactional account messages may use separate preferences."}
        </p>
      <Link href="/" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:w-auto">Return home</Link>
       </div>
      </Card>
    </main>
  );
}
