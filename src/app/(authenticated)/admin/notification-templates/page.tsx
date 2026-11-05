import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {isSuperAdmin} from "@/modules/identity/context";
import {logInitialZeptoMailTemplateReadiness,zeptoMailTemplateReadiness} from "@/modules/notifications/zeptomail-template-readiness";
import { Table } from "@/components/ui/table";
import { TextLink } from "@/components/ui/text-link";

export const dynamic="force-dynamic";
/** Operators see per-event status, never provider template keys. */
export default async function NotificationTemplateReadinessPage(){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context)||context.adminScope?.collegeId||context.adminScope?.organizationId)
  return <div className="space-y-4">
   <PageHeader title="Notification template readiness"/>
   <ErrorState title="Global Super Admin access required"
    description="Clear your selected organization and college. Template provisioning is platform-wide and is not editable here."
    action={<TextLink href="/admin/settings">Admin settings</TextLink>}/>
  </div>;
 logInitialZeptoMailTemplateReadiness();
 const report=zeptoMailTemplateReadiness();
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin" title="Notification template readiness"
   description="Read-only configuration checks. No template identifiers or credentials are displayed."
   actions={<TextLink href="/admin/notification-templates">Recheck</TextLink>}/>
  <div className="flex flex-wrap items-center gap-3">
   <StatusBadge tone={report.ready?"success":"warning"}>{report.ready?"Required templates ready":"Some templates missing"}</StatusBadge>
   <span className="text-sm text-muted-foreground">{report.missing} required event templates missing · {report.disabled} intentionally disabled channels</span>
   <StatusBadge tone={report.otpReady?"success":"warning"}>OTP template {report.otpReady?"ready":"missing"}</StatusBadge>
  </div>
  {!report.ready?<p role="alert" className="border-b border-border pb-3 text-sm text-body">
   STARTUP WARNING: Missing templates cause only affected email sends to be skipped.
   Other channels remain unaffected. Check deployment environment provisioning.
  </p>:null}
  <div className="min-w-0 overflow-x-auto">
   <Table className="min-w-[460px]">
    <caption className="sr-only">Required and disabled notification event templates</caption>
    <thead><tr><th className="border-b border-border p-3">Legacy event</th>
     <th className="border-b border-border p-3">Channel</th>
     <th className="border-b border-border p-3">Readiness</th></tr></thead>
    <tbody>{report.events.map(item=><tr key={item.event} className="border-b border-border">
     <th scope="row" className="break-all p-3 font-semibold">{item.event}</th>
     <td className="p-3">{item.channel}</td>
     <td className="p-3"><StatusBadge tone={item.status==="READY"?"success":item.status==="MISSING TEMPLATE"?"warning":"neutral"}>{item.status}</StatusBadge></td>
    </tr>)}</tbody>
   </Table>
  </div>
  <p className="text-xs text-muted-foreground">Template provisioning is controlled by deployment secrets.
   Readiness does not validate remote provider acceptance. Nonproduction recipients remain allowlisted,
   and provider POST requests intentionally are not blindly retried.</p>
 </div>;
}
