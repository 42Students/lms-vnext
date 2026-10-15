import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getTpoBatchRegistrationSummary} from "@/modules/placements/tpo-batch-registration-summary-service";
import {getTpoBatch} from "@/modules/placements/tpo-batch-workspace-read-service";
import {prepareTpoBatchReminder} from "@/modules/placements/tpo-communication-prep-model";
export const dynamic="force-dynamic";
export default async function TpoBatchReminderPrep({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const context=await getCurrentRequestContext();
 const [registration,record]=await Promise.all([
  getTpoBatchRegistrationSummary(context,batchId),getTpoBatch(context,batchId),
 ]);
 const draft=prepareTpoBatchReminder({batchName:record.batch.name,unrecorded:registration.unrecorded,activeLearners:registration.activeLearners,available:registration.available,finished:!!record.lifecycle?.finishedAt});
 return <main className="min-w-0 space-y-5">
  <h1 className="text-xl font-semibold">{record.batch.name} — Registration reminder preparation</h1>
  <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Back to batch</Link>
  <p role="status" className="rounded-lg border border-border p-4 text-sm">{draft.status}</p>
  <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <label className="block text-sm">Subject<input readOnly value={draft.subject} className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
   <label className="block text-sm">Message<textarea readOnly value={draft.body} rows={4} className="mt-1 w-full rounded border border-border bg-surface p-3"/></label>
  </section>
  <p className="text-xs text-muted-foreground">This preview does not select phone numbers, send messages, imply consent or update learner registration status.</p>
  <Link href={"/tpo/batches/"+batchId+"/registrations?choice=UNRECORDED"} className="inline-flex min-h-11 items-center text-primary-text underline">Review learners with no recorded choice</Link>
 </main>;
}
