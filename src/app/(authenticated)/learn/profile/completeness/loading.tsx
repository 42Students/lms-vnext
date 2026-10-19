import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function ProfileChecklistLoading() {
  return <GracefulPageLoading label="Loading profile completeness…" shape="card" />;
}
