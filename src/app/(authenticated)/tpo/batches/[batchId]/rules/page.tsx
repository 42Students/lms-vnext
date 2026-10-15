import Link from "next/link";
import { TpoBatchDecisionControl } from "@/components/tpo/tpo-batch-decision-control";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getTpoBatch } from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function BatchRules({params}:{params:Promise<{batchId:string}>}){
 const {batchId}=await params;
 const {batch,lifecycle,ready,decision}=await getTpoBatch(await getCurrentRequestContext(),batchId);
 return <main className="min-w-0 space-y-4"><h1 className="text-xl font-semibold">{batch.name} — Rules</h1>
 <Link href={"/tpo/batches/"+batchId} className="text-primary-text underline">Batch overview</Link>
 {!ready?<p role="status" className="rounded border border-border p-4">Batch lifecycle table is not registered. Rules are not editable until migration.</p>:
 <section className="rounded border border-border p-4"><h2 className="font-semibold">Participation policy</h2>
 <dl className="mt-3 space-y-2 text-sm"><div><dt className="font-semibold">Registration deadline</dt><dd>{lifecycle?.registrationDeadline?.toISOString()??"Not set"}</dd></div>
 <div><dt className="font-semibold">Invited</dt><dd>{lifecycle?.invitedAt?.toISOString()??"Not yet"}</dd></div>
 <div><dt className="font-semibold">Finished</dt><dd>{lifecycle?.finishedAt?.toISOString()??"Open"}</dd></div></dl>
 <p className="mt-3 text-sm text-muted-foreground">No batch-specific override is shown unless it is stored. College rules remain the fallback.</p></section>}
 <TpoBatchDecisionControl batchId={batchId} current={decision}/>
 <Link href="/tpo/settings/rules" className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm">View college placement rules</Link>
 </main>;
}
