import { PageBackLink } from "@/components/ui/page-back-link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {SuperAdminTemplateCreateForm} from "@/components/projects/super-admin-template-create-form";
export default async function NewSuperAdminTemplatePage(){
 const ctx=await getCurrentRequestContext();
 if (!can(ctx,"project-template.manage")) return <div className="w-full min-w-0 space-y-5">
  <PageHeader title="New project template"
   actions={<PageBackLink href="/admin/projects/templates" label="Template catalogue"/>}/>
  <ErrorState title="Access denied" description="Global project templates can only be created outside a selected college or organization scope."/>
 </div>;
 return <div className="min-w-0 space-y-5">
  <PageHeader title="New project template"
   description="Create a global draft with a valid starting blueprint. College-scoped administrators cannot publish global templates."
   actions={<PageBackLink href="/admin/projects/templates" label="Template catalogue" />}/>
  <SuperAdminTemplateCreateForm/>
 </div>;
}
