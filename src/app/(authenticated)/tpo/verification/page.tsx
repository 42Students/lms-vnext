import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoVerificationPanel} from "@/components/verification/TpoVerificationPanel";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage(){
 const queue=await getTpoVerificationQueue(await getCurrentRequestContext());
 return <main className="min-w-0 space-y-4">
  <nav className="flex flex-wrap items-center gap-3">
    <Link href="/tpo/students" className="text-sm text-primary-text underline">Back to students</Link>
    {queue.available&&queue.enabled&&queue.permitted?
     <a href="/api/tpo/verification/export"
       className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">Export queue CSV</a>:null}
  </nav>
  {!queue.available?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Verification</h1>
   <p>Could not check your verification access</p>
  </section>:!queue.enabled||!queue.permitted?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">You cannot verify profiles here</h1>
   <p className="text-sm">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
    :"Your verification access has been removed. Ask your college admin."}</p>
  </section>:<TpoVerificationPanel rows={queue.rows}/>}
 </main>;
}
