import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {SuperAdminTemplateCreateForm} from "@/components/projects/super-admin-template-create-form";
export default async function NewSuperAdminTemplatePage(){
 const ctx=await getCurrentRequestContext();
 requirePermission(ctx,"project-template.manage");
 return <div className="min-w-0 space-y-5">
  <Link href="/admin/projects/templates" className="text-sm font-semibold text-primary-text">← Template catalogue</Link>
  <PageHeader eyebrow="Super Admin · Projects" title="New project template"
   description="Create a global draft with a valid starting blueprint. College-scoped administrators cannot publish global templates."/>
  <SuperAdminTemplateCreateForm/>
 </div>;
}
