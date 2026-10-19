import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function LoadingUnassignedUsers() {
  return <GracefulPageLoading label="Loading global identities" shape="directory" />;
}
