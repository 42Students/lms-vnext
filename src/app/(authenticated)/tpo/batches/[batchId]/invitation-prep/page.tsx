import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
import { prepareTpoBatchInvite } from "@/modules/placements/tpo-communication-prep-model";
export const dynamic = "force-dynamic";
export default async function TpoBatchInvitePrep({params}:{params:Promise<{batchId:string}>}) {
 const {batchId}=await params;
 const {batch,ready,lifecycle}=await getTpoBatch(await getCurrentRequestContext(),batchId);
 const draft=prepareTpoBatchInvite({batchName:batch.name,deadline:ready?lifecycle?.registrationDeadline??null:null,invitedAt:ready?lifecycle?.invitedAt??null:null,finishedAt:ready?lifecycle?.finishedAt??null:null});
 return <main className="min-w-0 space-y-5">
   <h1 className="text-xl font-semibold">{batch.name} — Invitation preparation</h1>
   <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Back to batch</Link>
   <p className="text-sm text-body">Manual draft only: no learner list, phone numbers, invitation event or outbound message is created.</p>
   {!ready?<p role="status" className="rounded border border-border p-4">Batch lifecycle data is unavailable. Do not treat this preview as an invitation approval or deadline confirmation.</p>:null}
   {draft.warning?<p role="status" className="rounded border border-border p-4">{draft.warning}</p>:null}
   <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
    <label className="block text-sm">Invitation subject<input readOnly value={draft.subject} className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3"/></label>
    <label className="block text-sm">Invitation draft<textarea readOnly rows={5} value={draft.body} className="mt-1 w-full rounded border border-border bg-surface p-3"/></label>
   </section>
   <Link href={"/tpo/batches/"+batchId+"/registrations"} className="inline-flex min-h-11 items-center text-primary-text underline">Check actual learner registration choices</Link>
 </main>;
}
