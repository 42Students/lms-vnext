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
       <div className="min-w-0 space-y-4">
      <PageHeader title={cell ? "You're unsubscribed" : "Email preference updated"} />
        <p role="status" className="max-w-prose break-words text-base leading-6 text-body">
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
