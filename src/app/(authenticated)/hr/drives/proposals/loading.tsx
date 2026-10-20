import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 max-w-full"><GracefulPageLoading label="Loading sent drive proposals" shape="directory"/></div>;
}
