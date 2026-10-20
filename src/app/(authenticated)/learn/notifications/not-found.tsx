import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
export default function LearnerNotificationsNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Notification filter unavailable"/><Alert tone="warning">The requested notification category, unread filter, or search is invalid.</Alert><Link href="/learn/notifications" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:w-auto md:min-h-9">View all notifications</Link></section>;}
