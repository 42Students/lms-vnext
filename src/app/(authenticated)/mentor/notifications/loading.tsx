import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

export default function MentorNotificationsLoading() {
  return <section className="space-y-6" aria-busy="true" aria-label="Loading Mentor notifications">
    <PageHeader eyebrow="Mentor" title="Notifications"
      description="Loading your notifications and project attention…" />
    <GracefulPageLoading label="Loading Mentor notifications" shape="directory" />
  </section>;
}
