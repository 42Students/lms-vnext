import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
export default function TenantDetailLoading() {
  return <GracefulPageLoading label="Loading tenant identity and lifecycle in the current safety scope…" />;
}
