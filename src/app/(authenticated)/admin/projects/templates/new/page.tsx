import { PageBackLink } from "@/components/ui/page-back-link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import {SuperAdminTemplateCreateForm} from "@/components/projects/super-admin-template-create-form";
export default async function NewSuperAdminTemplatePage(){
 const ctx=await getCurrentRequestContext();
 if (!can(ctx,"project-template.manage")) return <div className="min-w-0 max-w-full space-y-4 md:space-y-5">
  <PageBackLink href="/admin/projects/templates" label="Back to templates"/>
  <PageHeader title="Create project template"/>
  <ErrorState title="Access denied"
    description="Clear the selected college and organization in the Super Admin scope switcher before authoring global project templates."
    action={<PageBackLink href="/admin/projects/templates" label="Back to templates"/>}/>
 </div>;
 // The inherited admin layout renders the Super Admin Projects group tabs.
 // Do not duplicate them here; legacy creation lived INSIDE that tabstrip.
 return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <PageHeader title="Create project template"
   description="Define the reusable blueprint for workspaces."
   actions={<PageBackLink href="/admin/projects/templates" label="Back to templates" />}/>
  <section aria-label="Project template form" className="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-[var(--lms-space-4)] md:p-[var(--lms-space-6)]">
   <p className="mb-[var(--lms-space-4)] text-sm text-muted-foreground">
    Keep the template generic. Live meetings, activity, and submission state belong to workspaces.
   </p>
   <SuperAdminTemplateCreateForm/>
  </section>
  <Banner tone="info" role="status">
    College-scoped administrators cannot publish global templates. This is a
    platform-wide project template, independent of any single college's
    Projects module availability. Workspace creation still requires the
    effective college module permissions and an active membership.
  </Banner>
 </div>;
}
