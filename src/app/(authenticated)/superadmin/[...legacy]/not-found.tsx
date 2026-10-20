import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function LegacySuperAdminNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Super Admin" />
    <ErrorState title="Page not found" description="This legacy bookmark is not available in the current workspace."
      action={<Link href="/admin/academics" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Open Super Admin</Link>}/>
  </div>;
}
