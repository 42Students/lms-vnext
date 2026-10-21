import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { ErrorState } from "@/components/ui/error-state";
import { listSuperAdminSmsDeliveryAttempts } from "@/modules/messaging/receipt-detail-service";

export const dynamic="force-dynamic";

/** Global support roles only. Do not expose recipient HMACs, full phone,
 * SMS body, provider credentials or raw provider error payloads.
 */
export default async function AdminSmsLogPage(){
 const context=await getCurrentRequestContext();
 const result=await listSuperAdminSmsDeliveryAttempts(context,{limit:50})
  .then(items=>({ok:true as const,items}))
  .catch(()=>({ok:false as const,items:[]}));
 if(!result.ok)return <div className="min-w-0 space-y-4">
  <PageHeader title="SMS delivery attempts"/>
  <ErrorState title="SMS delivery log unavailable"
   description="Only an unscoped Super Admin support session may view provider attempt records."
   action={<Link href="/admin/settings" className="underline font-semibold">Back to Tenant Settings</Link>}/>
 </div>;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="SMS delivery attempts"
   description="Provider acceptance is not proof of handset delivery."/>
  <Alert tone="info">
   This support-only list contains up to 50 recent attempts. Recipients are intentionally masked
   and cannot be reconstructed from these records.
  </Alert>
  <DataTable rows={result.items} getRowKey={row=>row.id}
   caption="Provider SMS attempt log" empty={<p className="text-sm">No recorded SMS attempts.</p>}
   columns={[
    {key:"time",header:"Attempted",mobilePriority:"primary" as const,
     cell:row=>new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
       dateStyle:"medium",timeStyle:"short"}).format(row.attemptedAt)+" IST"},
    {key:"purpose",header:"Purpose",mobilePriority:"secondary" as const,
     cell:row=>row.purpose},
    {key:"state",header:"Status",mobilePriority:"secondary" as const,
     cell:row=>row.outcome==="PROVIDER_ACCEPTED"?"Provider accepted (not delivered)":row.outcome},
    {key:"template",header:"Template",mobilePriority:"secondary" as const,
     cell:row=>row.templateKey??"—"},
    {key:"error",header:"Error code",mobilePriority:"secondary" as const,
     cell:row=>row.errorCode??"—"},
   ]}/>
  <Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
   Back to Tenant Settings
  </Link>
 </div>;
}
