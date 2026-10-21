import { Skeleton } from "@/components/ui/skeleton";

/** The legacy MovedPage transition shows exactly three paragraph rows. */
export default function LearnerInterviewLoading() {
  return <section aria-label="Loading your interviews" className="min-w-0 space-y-4 p-4 md:p-6">
    <Skeleton variant="line" count={3} label="Loading your interviews…" />
  </section>;
}
