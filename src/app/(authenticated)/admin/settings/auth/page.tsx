import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {requirePermission} from "@/modules/permissions/policy";
import {platformAuthPostureItems} from "@/modules/platform-settings/auth-posture-model";
export default async function SuperAdminAuthSettings(){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 return <div className="min-w-0 space-y-6">
  <Link href="/admin/settings" className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text">← Platform settings</Link>
  <PageHeader eyebrow="Super Admin · Platform Security" title="Authentication settings"
   description="Read-only checklist of deployment-managed privileged login policies. This page neither inspects secrets nor changes authentication."/>
  <div role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
   Configuration runtime status is not attested by this page. Privileged second-factor readiness must be verified separately before production.
  </div>
  <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
   {platformAuthPostureItems().map(item=><li key={item.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="break-words font-semibold text-foreground">{item.title}</h2>
    <p className="mt-2 text-sm text-body">{item.description}</p>
    <p className="mt-3 text-xs font-semibold text-muted-foreground">{item.state}</p>
   </li>)}
  </ul>
  <p className="text-xs text-muted-foreground">No credentials, cookie secrets, signing keys, permitted IPs, provider tokens or environment values are displayed or editable.</p>
 </div>;
}
