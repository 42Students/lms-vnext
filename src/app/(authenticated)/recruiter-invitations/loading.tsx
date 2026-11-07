import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function Loading() {
  return <div className="min-w-0 max-w-full" aria-label="Recruiter invitations loading">
    <GracefulPageLoading label="Checking your recruiter invitations…" shape="directory" />
  </div>;
}
