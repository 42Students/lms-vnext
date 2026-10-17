import Link from "next/link";
import {z} from "zod";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoMessagingBatch} from "@/modules/messaging/receipt-detail-service";
export default async function BatchDetail({params}:{params:Promise<{batchId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {batchId}=await params;
 if(!z.string().uuid().safeParse(batchId).success)notFound();
 const batch=await getTpoMessagingBatch(context,batchId);
 if(!batch)notFound();
 return <main className="space-y-6">
  <PageHeader eyebrow="Engage · Campaigns" title="Delivery batch"
    description={batch.purpose+" · Provider acceptance is not recipient delivery."}/>
  <Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 items-center text-primary-text">Back to history</Link>
  <section className="rounded-xl border border-border bg-surface p-5">
   <p className="text-sm text-body">{batch.finalizedAt?"Finalized":"Not finalized"} · {batch.actualReceipts} persisted receipts of {batch.total} intended</p>
   <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
    {([["Queued",batch.actualQueued],["Provider accepted",batch.actualSent],
      ["Failed",batch.actualFailed],["Suppressed",batch.actualSuppressed]] as const).map(([label,count])=>
     <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{count}</dd></div>)}
   </dl>
  </section>
  <p className="text-xs text-muted-foreground">For privacy, individual addresses, phone numbers, template variables, invitation links, and opaque recipient keys are not displayed.</p>
 </main>;
}
