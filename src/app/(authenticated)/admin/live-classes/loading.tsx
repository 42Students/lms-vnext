import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function SuperAdminLiveClassesLoading() {
  return <div aria-label="Loading live classes"><GracefulPageLoading label="Loading live classes" shape="directory" /></div>;
}
