import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** UX: bounded skeleton with a visible recovery action on slow networks. */
export default function Loading() {
  return <GracefulPageLoading label="Loading mapping…" shape="directory" />;
}
