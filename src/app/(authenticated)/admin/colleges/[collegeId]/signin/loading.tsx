import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/** A bounded, recoverable loading state with old-LMS card-sized placeholder. */
export default function Loading() {
  return <div className="min-w-0 max-w-3xl space-y-[var(--lms-space-4)]">
    <PageHeader title="Sign-in methods" />
    <Skeleton variant="card" label="Loading sign-in settings" />
    <GracefulPageLoading />
  </div>;
}
