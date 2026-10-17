import { PageLoading } from "@/components/ui/page-loading";

export default function LoadingMentorProject() {
  return <PageLoading label="Loading project…" variant="card" count={3} />;
}
