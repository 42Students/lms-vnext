import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoVerificationPanel} from "@/components/verification/TpoVerificationPanel";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import {tpoVerificationQuerySchema,tpoVerificationHref} from "@/modules/verification/tpo-queue-server-model";

export const dynamic="force-dynamic";

export default async function TpoVerificationPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const first=(key:string)=>Array.isArray(params[key])?params[key][0]:params[key];
 const parsed=tpoVerificationQuerySchema.safeParse({
  tab:first("tab"),kind:first("kind"),waitingState:first("waitingState"),
  page:first("page"),pageSize:first("pageSize"),
 });
 if(!parsed.success)return <main className="space-y-3 p-5">
  <h1 className="text-lg font-semibold">Invalid verification filters</h1>
  <p role="alert">No verification records were loaded. Choose a supported status or reset the filters.</p>
  <Link href="/tpo/verification" className="text-primary-text underline">Clear filters</Link>
 </main>;
 const query=parsed.data;
 const queue=await getTpoVerificationQueue(await getCurrentRequestContext(),query);
 return <main className="min-w-0 space-y-4">
  <nav className="flex flex-wrap items-center gap-3">
    <Link href="/tpo/students" className="text-sm text-primary-text underline">Back to students</Link>
    {queue.available&&queue.enabled&&queue.permitted?
     <div className="flex flex-wrap gap-2">
       {([["WAITING","Waiting"],["SENT_BACK","Sent back"],["VERIFIED","Verified"]] as const).map(([tab,label])=>
        <a key={tab} href={"/api/tpo/verification/export?tab="+tab}
          className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">{label} CSV</a>)}
     </div>:null}
  </nav>
  {!queue.available?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">Verification</h1>
   <p>Could not check your verification access</p>
  </section>:!queue.enabled||!queue.permitted?<section role="status" className="rounded border border-border p-4">
   <h1 className="font-semibold">You cannot verify profiles here</h1>
   <p className="text-sm">{!queue.enabled
    ?"Your college admin has not allowed the placement cell to verify profiles"
    :"Your verification access has been removed. Ask your college admin."}</p>
  </section>:<><TpoVerificationPanel rows={queue.rows}/>
  <nav aria-label="Verification pages" className="flex items-center gap-3 text-sm">
   {query.page>1?<Link href={tpoVerificationHref({...query,page:query.page-1})} className="text-primary-text underline">Previous page</Link>:null}
   <span>Page {query.page}; up to {query.pageSize} records per page.</span>
   {queue.hasMore?<Link href={tpoVerificationHref({...query,page:query.page+1})} className="text-primary-text underline">Next page</Link>:null}
  </nav></>}
 </main>;
}
