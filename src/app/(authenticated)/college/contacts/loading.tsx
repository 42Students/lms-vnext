import { PageLoading } from "@/components/ui/page-loading";

export default function LoadingCollegeContacts() {
  return <PageLoading label="Loading college contacts…" variant="row" count={5} />;
}
