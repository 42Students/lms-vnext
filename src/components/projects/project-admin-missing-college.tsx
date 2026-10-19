import { PageBackLink } from "@/components/ui/page-back-link";
import {PageHeader} from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
/** COL-projects-20: do not silently redirect a valid user with no selected college. */
export function ProjectAdminMissingCollege() {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Project workspaces" description="Select a college to continue."/>
  <Banner tone="warning" action={<PageBackLink href="/dashboard" label="Back to dashboard" />}>
   Project workspaces are college-scoped. Pick a college in the header to manage its project workspaces.
  </Banner>
 </div>;
}
