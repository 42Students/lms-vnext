import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Keep learner assignment progress named for screen readers and retries. */
export default function Loading() {
  return <GracefulPageLoading label="Loading assignments" shape="directory" />;
}
