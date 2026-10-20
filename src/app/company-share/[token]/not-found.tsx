import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import authStyles from "@/components/public/public-auth-skin.module.css";

export default function CompanyShareNotFound() {
  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10`}>
      <section role="alert" className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
        <PageHeader title="This link is not valid any more." />
        <p className="text-sm text-body">
          It may have expired or been withdrawn. Please ask the placement cell for a new one.
        </p>
        <Link href="/" className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Home
        </Link>
      </section>
    </main>
  );
}
