import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function AuthenticatedLoading() {
  return <div className="min-w-0 max-w-full"><GracefulPageLoading label="Loading your workspace…" shape="directory" /></div>;
}
