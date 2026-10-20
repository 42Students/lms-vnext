import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { PageHeader } from "@/components/ui/page-header";

/** The entrypoint redirects into Today; its fallback should not resemble a directory. */
export default function Loading() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Today" />
    <GracefulPageLoading label="Opening recruiter Today…" />
  </div>;
}
