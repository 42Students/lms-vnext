import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function LearnerProjectsLoading() {
  return <GracefulPageLoading label="Refreshing projects…" shape="directory" />;
}
