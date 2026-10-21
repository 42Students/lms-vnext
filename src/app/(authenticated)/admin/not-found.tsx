import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

/** The existing authenticated shell supplies the single legacy page canvas. */
export default function NotFound() {
  return (
    <section className="min-w-0 space-y-4">
      <PageHeader title="Page not found" />
      <div className="min-w-0 space-y-4">
        <p className="m-0 max-w-prose break-words text-[13px] leading-5 text-body">
          This Super Admin page may have moved or is no longer available. Return to Tenant Setup, the verified Super Admin landing destination.
        </p>
        <Link href="/admin/tenants"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-[14px] font-[650] leading-5 text-[var(--lms-on-primary)] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-[var(--lms-control-height)]">
          Go to Tenant Setup
        </Link>
      </div>
    </section>
  );
}
