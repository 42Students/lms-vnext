import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { listSuperAdminSmsDeliveryAttempts } from "@/modules/messaging/receipt-detail-service";
import { SmsSupportLogViewer } from "@/components/admin/sms-support-log-viewer";

export const dynamic="force-dynamic";

/** Only an active unscoped Super Admin may read provider attempt records.
 * All subsequent filter requests are independently authorized by the API. */
export default async function AdminSmsLogPage(){
 const context=await getCurrentRequestContext();
 const allowed=await listSuperAdminSmsDeliveryAttempts(context,{limit:1})
  .then(()=>true).catch(()=>false);
 if(!allowed)return <div className="min-w-0 space-y-4">
  <PageHeader title="SMS delivery attempts"/>
  <ErrorState title="SMS delivery log unavailable"
   description="Only an unscoped Super Admin support session may view provider attempt records."
   action={<Link href="/admin/settings" className="underline font-semibold">Back to Tenant Settings</Link>}/>
 </div>;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="SMS delivery attempts"
   description="Provider acceptance is not proof of handset delivery."/>
  <SmsSupportLogViewer/>
  <Link href="/admin/settings" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
   Back to Tenant Settings
  </Link>
 </div>;
}
