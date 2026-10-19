import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export function MentorProjectsUnavailable({loadFailed=false}:{loadFailed?:boolean}) {
  return <div className="space-y-6">
    <PageHeader title={loadFailed?"Projects could not be loaded":"Projects is currently unavailable"}
      description={loadFailed?"Check your connection and try again. This does not mean Projects is disabled.":"Projects is currently unavailable for your account. Contact your administrator if you need access."} />
    <div className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)] text-sm text-body">
      {loadFailed?<Link href="/mentor/projects?retry=1" className="mr-3 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry access check</Link>:null}
      Notifications are still available.
      <Link href="/mentor/notifications" className="ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        View notifications
      </Link>
    </div>
  </div>;
}
