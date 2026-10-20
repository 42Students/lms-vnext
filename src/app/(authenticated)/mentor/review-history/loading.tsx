import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function Loading() {
  return <section aria-busy="true" aria-label="Loading delivery review history" className="min-w-0 max-w-full"><GracefulPageLoading label="Loading delivery review history" shape="directory"/></section>;
}
