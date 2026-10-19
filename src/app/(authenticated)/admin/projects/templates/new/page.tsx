import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {can} from "@/modules/permissions/policy";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {SuperAdminTemplateCreateForm} from "@/components/projects/super-admin-template-create-form";
export default async function NewSuperAdminTemplatePage(){
 const ctx=await getCurrentRequestContext();
 if (!can(ctx,"project-template.manage")) return <div className="w-full min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Projects" title="New project template"/>
  <ErrorState title="Access denied" description="Global project templates can only be created outside a selected college or organization scope."
   action={<Link href="/admin/projects/templates" className="font-semibold text-primary-text">Back to template catalogue</Link>}/>
 </div>;
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · Projects" title="New project template"
   description="Create a global draft with a valid starting blueprint. College-scoped administrators cannot publish global templates."
   actions={<Link href="/admin/projects/templates" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3.5 text-sm font-semibold text-primary-text sm:min-h-9">← Template catalogue</Link>}/>
  <SuperAdminTemplateCreateForm/>
 </div>;
}
