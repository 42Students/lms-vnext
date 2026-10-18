import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Legacy bookmark handoff keeps a bounded loading recovery. */
export default function Loading() {
  return <GracefulPageLoading />;
}
