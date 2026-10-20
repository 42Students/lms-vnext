import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function MentorNotificationsLoading() {
  return <section className="min-w-0 max-w-full space-y-4 md:space-y-6" aria-busy="true" aria-label="Loading Mentor notifications">
    <PageHeader eyebrow="Mentor" title="Notifications"
      description="Loading your notifications and project attention…" />
    <GracefulPageLoading label="Loading Mentor notifications" shape="directory" />
  </section>;
}
