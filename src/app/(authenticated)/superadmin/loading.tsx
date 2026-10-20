import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Legacy bookmark handoff keeps a bounded loading recovery. */
export default function Loading() {
  return <div className="min-w-0 max-w-full"><GracefulPageLoading label="Opening Super Admin academics…" shape="directory" /></div>;
}
