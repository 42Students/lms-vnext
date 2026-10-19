import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Legacy LMS: one canvas, compact page heading and hairline rows. */
export default function Loading() {
  return <GracefulPageLoading label="Loading my placements…" shape="directory" />;
}
