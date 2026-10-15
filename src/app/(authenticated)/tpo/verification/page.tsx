import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { VerificationWorkspace } from "@/components/verification/VerificationWorkspace";
import { getTpoVerificationQueue } from "@/modules/placements/tpo-verification-queue-service";
export const dynamic="force-dynamic";
export default async function TpoVerificationPage(){
 const queue=await getTpoVerificationQueue(await getCurrentRequestContext());
 return <main className="min-w-0 space-y-4">
  <Link href="/tpo/students" className="text-sm text-primary-text underline">Back to students</Link>
  {!queue.available?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Profile verification unavailable</h1>
   <p className="text-sm">Private verification tables have not been registered. No learner identity records were loaded.</p>
  </section>:!queue.enabled?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Profile verification is managed by College Admin</h1>
   <p className="text-sm">The college admin must explicitly enable placement-cell verification before this workspace is available.</p>
  </section>:!queue.permitted?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Verifier access required</h1>
   <p className="text-sm">The college permits placement-cell verification, but your active TPO membership has no individual verifier grant.</p>
  </section>:<>
   <p className="rounded border border-border p-3 text-sm text-muted-foreground">Showing up to 100 most recently submitted sections. Review actions are disabled until server-side private-document verification can be completed. Missing marksheet and batch filters are not yet certified.</p>
   <VerificationWorkspace rows={queue.rows}/>
  </>}
 </main>;
}
