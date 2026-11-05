import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerNotificationsNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Notification filter unavailable"/><Alert tone="warning">The requested notification category, unread filter, or search is invalid.</Alert><ButtonLink variant="secondary" href="/learn/notifications" className="w-full sm:w-auto">View all notifications</ButtonLink></section>;}
