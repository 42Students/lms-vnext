import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {can} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {ErrorState} from "@/components/ui/error-state";
import {platformAuthPostureItems} from "@/modules/platform-settings/auth-posture-model";
import {LEGACY_TENANT_SETTING_SPECS} from "@/modules/platform-settings/legacy-setting-specs";
export default async function SuperAdminAuthSettings(){
 const context=await getCurrentRequestContext();
 // Privileged auth posture is read-only, but even the key inventory must not
 // be presented to a disabled actor or a college-only account on a deep link.
 if(!isSuperAdmin(context)||!can(context,"admin-scope.select"))
  return <div className="min-w-0 space-y-6">
   <PageHeader eyebrow="Super Admin · Platform Security" title="Authentication settings"/>
   <ErrorState title="Authentication settings access denied"
    description="Your account cannot view privileged authentication policies."
    action={<Link href="/dashboard" className="font-semibold text-primary-text underline">Back to dashboard</Link>}/>
  </div>;
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="Super Admin · Platform Security" title="Authentication settings"
   description="Read-only checklist of deployment-managed privileged login policies. This page neither inspects secrets nor changes authentication."
   actions={<Link href="/admin/settings" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3.5 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">← Platform settings</Link>} />
  <div role="status" className="border-b border-border pb-4 text-sm text-body">
   Configuration runtime status is not attested by this page. Privileged second-factor readiness must be verified separately before production.
  </div>
  <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
   {platformAuthPostureItems().map(item=><li key={item.id} className="min-w-0 border-b border-border py-4">
    <h2 className="break-words font-semibold text-foreground">{item.title}</h2>
    <p className="mt-2 text-sm text-body">{item.description}</p>
    <p className="mt-3 text-xs font-semibold text-muted-foreground">{item.state}</p>
   </li>)}
  </ul>
  <section aria-label="Legacy platform and auth setting keys" className="space-y-3 border-b border-border pb-5">
   <h2 className="font-semibold">Platform &amp; auth policy keys</h2>
   <p className="text-sm text-body">Names and validation are listed for review. Environment and live network configuration are never displayed. Changes to host, cookie or network controls require manual deployment acceptance.</p>
   <ul className="space-y-2 text-sm">{LEGACY_TENANT_SETTING_SPECS.filter(spec=>spec.group==="Platform & auth").map(spec=><li key={spec.key} className="border-b border-border py-3">
    <strong className="block">{spec.label}</strong>
    <code className="break-all text-xs">{spec.key}</code>
    {spec.dangerous?<span className="ml-2 text-warning-text">High impact · deployment gated</span>:null}
   </li>)}</ul>
   <Link href="/admin/settings" className="inline-flex min-h-11 items-center text-primary-text underline">Open Global Tenant Settings editor</Link>
  </section>
  <p className="text-xs text-muted-foreground">No credentials, cookie secrets, signing keys, permitted IPs, provider tokens or environment values are displayed or editable.</p>
 </div>;
}
