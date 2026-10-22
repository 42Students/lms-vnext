import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import authStyles from "@/components/public/public-auth-skin.module.css";

const companySharePageClass = `${authStyles["page"]} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 flex-col justify-center px-4 pb-8 pt-24 min-[768px]:py-12`;

export default function CompanyShareNotFound() {
  return (
    <main className={companySharePageClass}>
      <section aria-label="Expired or invalid applicant share" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-6">
        <PageHeader title="This link is not valid any more." />
        <p className="text-sm text-body">
          It may have expired or been withdrawn. Please ask the placement cell for a new one.
        </p>
        <Link href="/" className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          Home
        </Link>
      </section>
    </main>
  );
}
