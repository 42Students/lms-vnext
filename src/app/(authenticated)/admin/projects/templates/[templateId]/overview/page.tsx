import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {requirePermission} from "@/modules/permissions/policy";
import {projectTemplateIdSchema} from "@/modules/projects/validation";
import {templateSubviewHref} from "@/modules/projects/template-subview-model";
/** Legacy explicit Overview route resolves to the canonical template overview. */
export default async function TemplateOverviewAlias({params}:{params:Promise<{templateId:string}>}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"project-template.read");
 const result=projectTemplateIdSchema.safeParse((await params).templateId);
 if(!result.success)notFound();
 redirect(templateSubviewHref(result.data,"overview"));
}
