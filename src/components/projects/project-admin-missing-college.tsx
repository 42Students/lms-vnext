import { PageBackLink } from "@/components/ui/page-back-link";
import {PageHeader} from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
/** COL-projects-20: do not silently redirect a valid user with no selected college. */
export function ProjectAdminMissingCollege({ variant }: { variant?: "at-risk" }) {
 if (variant === "at-risk") return <div className="min-w-0 space-y-4">
  <PageHeader title="At-risk projects" />
  <Alert tone="warning" title="Select a college to continue">
    Choose a college in the header above to see its at-risk projects.
  </Alert>
 </div>;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Project workspaces" description="Select a college to continue."/>
  <EmptyState title="No college selected"
    description="Project workspaces are college-scoped. Pick a college in the header to manage its project workspaces."
    action={<PageBackLink href="/dashboard" label="Back to dashboard" />} />
 </div>;
}
