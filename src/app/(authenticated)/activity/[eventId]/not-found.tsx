import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function ActivityEventNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Activity Log" />
    <ErrorState title="Activity event not found" description="This event is no longer available in your permitted activity scope."
      action={<Link href="/activity" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Back to activity</Link>}/>
  </div>;
}
