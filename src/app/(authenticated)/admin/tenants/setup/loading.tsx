import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** UX: bounded skeleton with retry when the connection stalls. */
export default function Loading() {
  return <GracefulPageLoading label="Loading tenant setup…" shape="directory" />;
}
