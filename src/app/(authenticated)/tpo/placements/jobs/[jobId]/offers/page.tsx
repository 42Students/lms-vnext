import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {getTpoDriveOfferRegister} from "@/modules/placements/tpo-drive-offer-register-service";
import {offerRegisterQuery} from "@/modules/placements/tpo-drive-offer-register-model";
export default async function OffersPage({params,searchParams}:{params:Promise<{jobId:string}>,searchParams:Promise<{status?:string|string[];page?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const [p,q]=await Promise.all([params,searchParams]);
 const raw=Array.isArray(q.status)?q.status[0]:q.status;
 const page=Array.isArray(q.page)?q.page[0]:q.page;
 const parsed=offerRegisterQuery.safeParse({jobId:p.jobId,status:raw||"ALL",...(page?{page}:{})});
 if(!parsed.success)notFound();
 let data:Awaited<ReturnType<typeof getTpoDriveOfferRegister>>;
 try{data=await getTpoDriveOfferRegister(context,parsed.data)}
 catch(e){if(e instanceof PlacementsServiceError&&e.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw e}
 const root="/tpo/placements/jobs/"+encodeURIComponent(data.job.id);
 const tabs=[["ALL","All",data.counts.all],["ISSUED","Issued",data.counts.issued],["ACCEPTED","Accepted",data.counts.accepted],["DECLINED","Declined",data.counts.declined],["WITHDRAWN","Withdrawn",data.counts.withdrawn]] as const;
 return <div className="space-y-6">
  <Link href={root} className="text-sm font-semibold text-primary-text">← Back to drive</Link>
  <PageHeader eyebrow="TPO · Offers" title={data.job.title+" · Offer register"} description="Persisted offer versions and recorded joining outcomes; screening results are not employer selection."/>
  <nav aria-label="Offer status" className="flex flex-wrap gap-2">{tabs.map(([value,label,count])=>
   <Link key={value} href={root+"/offers?status="+value} aria-current={data.status===value?"page":undefined}
    className="inline-flex min-h-10 items-center rounded border border-border bg-surface px-3 text-sm font-semibold text-primary-text">{label} ({count})</Link>)}</nav>
  <p role="status" className="text-sm text-body">Showing {data.totalMatching===0?0:(data.page-1)*data.pageSize+1}–{Math.min(data.totalMatching,data.page*data.pageSize)} of {data.totalMatching} matching offer versions. Page {data.page} of {data.totalPages}.</p>
  {data.rows.length===0?<p role="status" className="rounded border border-border p-5 text-sm">No offers match this filter.</p>:
   <section aria-label="Recorded offers" className="grid gap-3">{data.rows.map(row=><article key={row.id} className="rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold text-foreground">{row.name}</h2><p className="text-sm text-body">{row.role}</p></div><strong className="text-sm">{row.status}</strong></div>
    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt>Issued</dt><dd>{row.issued.slice(0,10)}</dd></div><div><dt>Responded</dt><dd>{row.responded?.slice(0,10)??"Not recorded"}</dd></div><div><dt>Joining</dt><dd>{row.joining??"Not applicable"}</dd></div></dl>
    <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold"><Link className="text-primary-text" href={root+"/offers/"+encodeURIComponent(row.id)}>Offer evidence →</Link>
    <Link className="text-primary-text" href={"/tpo/students/"+encodeURIComponent(row.membershipId)+"/history"}>Learner history →</Link>
    {row.status==="ACCEPTED"?<Link className="text-primary-text" href={root+"/joining"}>Joining tracker →</Link>:null}</div>
   </article>)}</section>}
  <nav aria-label="Offer register pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span className="text-body">Page {data.page} of {data.totalPages}</span>
   <div className="flex gap-4">{data.page>1?<Link href={root+"/offers?status="+data.status+"&page="+(data.page-1)} className="font-semibold text-primary-text">← Previous</Link>:null}
    {data.page<data.totalPages?<Link href={root+"/offers?status="+data.status+"&page="+(data.page+1)} className="font-semibold text-primary-text">Next →</Link>:null}</div>
  </nav>
  <p className="text-xs text-muted-foreground">Counts include all persisted offer versions, not unique learners. Unrecorded joining is pending only on accepted offers.</p>
 </div>;
}
