import { PageBackLink } from "@/components/ui/page-back-link";
import {PageHeader} from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import {ProjectAdminNav} from "./project-admin-nav";
/** COL-projects-20: do not silently redirect a valid user with no selected college. */
export function ProjectAdminMissingCollege({ variant }: { variant?: "at-risk" | "readiness" | "templates" }) {
 if (variant === "templates") return <div className="min-w-0 space-y-4">
  <ProjectAdminNav basePath="/college/projects" active="templates"/>
  <PageHeader title="Project templates"
   description="Pick a template to start a new project workspace."/>
  <Alert tone="warning" title="Admin not assigned to a college">
    You must be assigned to a college to view published project templates.
    Select your college in the header to continue.
  </Alert>
 </div>;
 if (variant === "readiness") return <div className="min-w-0 space-y-4">
  <PageHeader title="Submission readiness"
    description="See whether each team is ready to submit, and override the gate when you need to."/>
  <Alert tone="warning" title="No college selected">
    Select a college from the header to see submission readiness and manage overrides.
  </Alert>
 </div>;
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
