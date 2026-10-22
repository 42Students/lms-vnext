import Link from "next/link";
import {z} from "zod";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import tpoTileStyles from "@/components/placements/legacy-tpo-report-stats.module.css";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoMessagingBatch} from "@/modules/messaging/receipt-detail-service";
export default async function BatchDetail({params}:{params:Promise<{batchId:string}>}){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const {batchId}=await params;
 if(!z.string().uuid().safeParse(batchId).success)notFound();
 const batch=await getTpoMessagingBatch(context,batchId);
 if(!batch)notFound();
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Delivery batch"
    description={batch.purpose+" · Provider acceptance is not recipient delivery."}
    actions={<Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 w-full items-center justify-center text-primary-text underline hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-[var(--lms-control-height)]">Back to history</Link>}/>
  <section className="min-w-0 space-y-3 border-b border-border pb-5">
   <p className="text-sm text-body">{batch.finalizedAt?"Finalized":"Not finalized"} · {batch.actualReceipts} persisted receipts of {batch.total} intended</p>
   <div aria-label="Delivery receipts" className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
    {([["Queued",batch.actualQueued],["Provider accepted",batch.actualSent],
      ["Failed",batch.actualFailed],["Suppressed",batch.actualSuppressed]] as const).map(([label,count])=>
      <StatTile key={label} label={label} value={count} {...(tpoTileStyles["tile"]===undefined?{}:{className:tpoTileStyles["tile"]})} />)}
   </div>
  </section>
  <p className="text-xs text-muted-foreground">For privacy, individual addresses, phone numbers, template variables, invitation links, and opaque recipient keys are not displayed.</p>
 </div>;
}
