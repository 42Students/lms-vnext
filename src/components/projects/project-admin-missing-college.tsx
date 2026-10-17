import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
/** COL-projects-20: do not silently redirect a valid user with no selected college. */
export function ProjectAdminMissingCollege() {
 return <main className="space-y-4">
  <PageHeader title="Project workspaces" description="Select a college to continue."/>
  <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   Project workspaces are college-scoped. Pick a college in the header to manage its project workspaces.
  </p>
  <Link href="/dashboard" className="inline-flex min-h-11 items-center text-primary-text underline">
   Back to dashboard
  </Link>
 </main>;
}
