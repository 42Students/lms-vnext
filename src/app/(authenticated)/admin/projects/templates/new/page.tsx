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
 return <div className="min-w-0 space-y-4 md:space-y-5">
  <PageBackLink href="/admin/projects/templates" label="Back to templates" />
  <PageHeader title="Create project template"
   description="Define the reusable blueprint for workspaces. College-scoped administrators cannot publish global templates."/>
  <Banner tone="info" role="status">
    This is a platform-wide project template. Publishing a global blueprint is
    independent of any single college's Projects module availability. College
    assignments and workspace creation remain subject to each college's effective
    module access and membership permissions.
  </Banner>
  <SuperAdminTemplateCreateForm/>
 </div>;
}
