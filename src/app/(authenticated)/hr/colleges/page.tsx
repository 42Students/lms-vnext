import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {getRecruiterSelfGrantOverview} from "@/modules/placements/recruiter-self-grants-service";
import {recruiterCollegeCardDetail} from "@/modules/placements/recruiter-college-card-service";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";

const PER_PAGE=12;
/** The dedicated legacy Colleges directory is scoped to this recruiter and
 * its verified active grants; each card enriches independently and may retry. */
export default async function HrCollegesPage({searchParams}:{
 searchParams:Promise<{page?:string|string[]}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context)||!context.recruiter||
    context.recruiter.userId!==context.user.id)redirect("/dashboard");
 const raw=(await searchParams).page;
 const page=raw===undefined?1:typeof raw==="string"&&/^[1-9][0-9]*$/.test(raw)?Number(raw):NaN;
 if(!Number.isSafeInteger(page)||page<1||page>10000)return <div className="space-y-4">
  <PageHeader title="Colleges"/>
  <ErrorState title="Invalid college page" description="Choose a valid page of your authorized colleges."
   action={<Link href="/hr/colleges" className="text-primary-text underline">Start again</Link>}/>
 </div>;
 let overview:Awaited<ReturnType<typeof getRecruiterSelfGrantOverview>>;
 try{overview=await getRecruiterSelfGrantOverview(context);}
 catch{return <div className="space-y-4"><PageHeader title="Colleges"/>
  <ErrorState title="Could not load your colleges"
   description="We could not verify the current recruiter college access. No private college information is shown."
   action={<Link href="/hr/colleges" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Retry</Link>}/>
 </div>;}
 const verified=new Map(overview.grants.map(row=>[row.id,row]));
 const authorized=context.recruiter.grants.filter(grant=>verified.has(grant.id));
 const pages=Math.max(1,Math.ceil(authorized.length/PER_PAGE));
 const currentPage=Math.min(page,pages);
 const rows=authorized.slice((currentPage-1)*PER_PAGE,currentPage*PER_PAGE);
 const details=await Promise.allSettled(rows.map(grant=>recruiterCollegeCardDetail(context,grant.collegeId)));
 return <div className="min-w-0 space-y-5 md:space-y-6">
  <PageHeader title="Colleges" description={"Authorized placement-college directory for "+context.recruiter.companyName}/>
  <p className="text-sm text-body">Select an authorized college to see its placement contact, branches, learner population and your drives. Counts are never combined across colleges.</p>
  {authorized.length===0?<EmptyState title="No active college access" description="Ask the college placement cell to restore or extend your verified recruiter invitation."/>:
  <section aria-label="Authorized colleges" className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">
   {rows.map((grant,index)=>{
    const info=verified.get(grant.id)!;
    const detail=details[index]?.status==="fulfilled"
     ?(details[index] as PromiseFulfilledResult<Awaited<ReturnType<typeof recruiterCollegeCardDetail>>>).value:null;
    return <article key={grant.id} className="min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] py-5">
     <div className="flex min-w-0 items-center gap-3">
      {detail?.logoUrl?<img src={detail.logoUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded border border-border object-contain"/>:
       <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded border border-border bg-muted text-lg font-semibold">{info.collegeName.slice(0,1)}</span>}
      <div className="min-w-0"><h2 className="break-words text-lg font-semibold text-[var(--lms-heading)]">{info.collegeName}</h2>
       <p className="text-xs text-body">{info.collegeCode?"College code: "+info.collegeCode:"College code unavailable"} · Verified recruiter access</p>
      </div>
     </div>
     <p className="text-xs text-muted-foreground">Access granted: {info.grantedAtLabel} (IST) · {info.accessUntilLabel}</p>
     {detail?<dl className="grid min-w-0 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
       <div><dt className="font-semibold">Active learners</dt><dd>{detail.studentCount??"Unavailable"}</dd></div>
       <div><dt className="font-semibold">Your hiring drives</dt><dd>{detail.allDriveCount??"Unavailable"} {detail.liveDriveCount!==null?"· "+detail.liveDriveCount+" live":""}</dd></div>
       <div className="sm:col-span-2"><dt className="font-semibold">Branches</dt><dd className="mt-1">{detail.branches===null?"Unavailable":detail.branches.length===0?"No branches recorded":
        <span className="flex flex-wrap gap-2">{detail.branches.map(value=><span key={value} className="rounded border border-border px-2 py-1 text-xs">{value}</span>)}</span>}</dd></div>
       <div className="sm:col-span-2"><dt className="font-semibold">Placement-cell contact</dt>
        <dd>{detail.tpoContact?detail.tpoContact.name:"No TPO contact available"}
         {detail.tpoContact?.email?<> · <a href={"mailto:"+detail.tpoContact.email} className="text-primary-text underline">{detail.tpoContact.email}</a></>:null}</dd>
       </div>
      </dl>:<Alert tone="warning">College details are temporarily unavailable. Refresh to retry; missing values are not zero.</Alert>}
     {detail?.errors.length?<p role="status" className="text-xs text-muted-foreground">Could not load: {detail.errors.join(", ")}. Refresh to retry.</p>:null}
     <Link href={"/hr/home?collegeId="+encodeURIComponent(grant.collegeId)}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-[var(--lms-button-primary-hover)] md:min-h-9">
      Open recruiter Today
     </Link>
    </article>;
   })}
  </section>}
  {authorized.length>PER_PAGE?<nav aria-label="College pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3 text-sm">
   <span>Page {currentPage} of {pages} · {authorized.length} verified colleges</span>
   <div className="flex flex-wrap gap-3">
    {currentPage>1?<Link className="min-h-11 py-2 text-primary-text underline md:min-h-9" href={"/hr/colleges?page="+(currentPage-1)}>Previous</Link>:null}
    {currentPage<pages?<Link className="min-h-11 py-2 text-primary-text underline md:min-h-9" href={"/hr/colleges?page="+(currentPage+1)}>Next</Link>:null}
   </div>
  </nav>:null}
 </div>;
}
