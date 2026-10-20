import authStyles from "@/components/public/public-auth-skin.module.css";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default async function Unsubscribed({
  searchParams,
}: { searchParams: Promise<{ scope?: string }> }) {
  const cell = (await searchParams).scope === "placement-cell";
  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-lg min-w-0 flex-col justify-center gap-5 px-4 py-8 sm:py-12`}>
      <Card as="section" className="!p-[var(--lms-canvas-padding)]" style={{ boxShadow: "none" }}>
      <PageHeader title={cell ? "You're unsubscribed" : "Email preference updated"} />
        <p role="status" className="text-base leading-6 text-body">
          {cell
            ? "This placement cell will not email you again."
            : "Your address has been suppressed from campaign email. Transactional account messages may use separate preferences."}
        </p>
      <Link href="/" className="inline-flex min-h-11 items-center self-start md:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Return home</Link>
      </Card>
    </main>
  );
}
