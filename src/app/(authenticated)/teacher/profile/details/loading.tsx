import { PageLoading } from "@/components/ui/page-loading";

export default function LoadingFacultyProfileDetails() {
  return <PageLoading label="Loading Faculty profile…" variant="form" count={4} />;
}
