import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

/** COL-projects-20: do not silently redirect a valid user with no selected college. */
export function ProjectAdminMissingCollege() {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Project workspaces" description="Select a college to continue."/>
    <EmptyState title="No college selected"
      description="Project workspaces are college-scoped. Pick a college in the header to manage its project workspaces."
      action={<Link href="/dashboard"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Back to dashboard
      </Link>}/>
  </div>;
}
