import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <GracefulPageLoading label="Loading create drive form" shape="directory" />;
}
