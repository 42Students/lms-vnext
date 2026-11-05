import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function NotificationHistoryNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Notification history link unavailable"/><Alert tone="warning">The requested notification page or unread-history filter is invalid.</Alert><ButtonLink variant="secondary" href="/learn/notifications/history" className="w-full sm:w-auto">Return to newest</ButtonLink></section>;}
