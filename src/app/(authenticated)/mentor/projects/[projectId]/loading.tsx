import { PageLoading } from "@/components/ui/page-loading";

export default function LoadingMentorProject() {
  return <PageLoading label="Loading project…" variant="row" count={3} />;
}
