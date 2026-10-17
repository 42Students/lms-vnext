import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export function MentorProjectsUnavailable({loadFailed=false}:{loadFailed?:boolean}) {
  return <div className="space-y-6">
    <PageHeader title={loadFailed?"Projects could not be loaded":"Projects is currently unavailable"}
      description={loadFailed?"Check your connection and try again. This does not mean Projects is disabled.":"Projects is currently unavailable for your account. Contact your administrator if you need access."} />
    <div className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      {loadFailed?<Link href="/mentor/projects?retry=1" className="mr-3 inline-flex min-h-10 items-center font-semibold text-primary-text underline">Retry access check</Link>:null}
      Notifications are still available.
      <Link href="/mentor/notifications" className="ml-2 font-semibold text-primary-text underline">
        View notifications
      </Link>
    </div>
  </div>;
}
