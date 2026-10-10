import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export function MentorProjectsUnavailable() {
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor" title="Projects is turned off for your college"
      description="Projects is currently unavailable for your account. Contact your administrator if you need access." />
    <div className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Notifications are still available.
      <Link href="/mentor/notifications" className="ml-2 font-semibold text-primary-text underline">
        View notifications
      </Link>
    </div>
  </div>;
}
