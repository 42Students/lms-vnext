import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {HrProposalHistoryGrid} from "@/components/hr/hr-proposal-history-grid";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import {EmptyState} from "@/components/ui/empty-state";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
import {listHrDriveProposals} from "@/modules/placements/hr-drive-proposal-history-service";
import {hrSentProposalHistoryHref,hrSentProposalExportHref} from "@/modules/placements/hr-drive-proposal-history-links";

export default async function RecruiterDriveProposalHistory({
 searchParams,
}:{searchParams:Promise<{collegeId?:string|string[];page?:string|string[];q?:string|string[];sort?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context)||context.recruiter?.userId!==context.user.id)redirect("/dashboard");
 const raw=await searchParams;
 // Repeated college/page/filter keys must not silently choose the first
 // value. Zod rejects arrays and triggers the existing safe recovery route.
 const input=hrDriveProposalHistoryQuerySchema.safeParse({
  collegeId:raw.collegeId,page:raw.page,q:raw.q,sort:raw.sort,
 });
 if(!input.success)notFound();
 const data=await listHrDriveProposals(context,input.data);
 return <div className="min-w-0 max-w-full space-y-4 min-[768px]:space-y-6">
  <PageHeader title="Sent drive proposals"
   description="Private placement-cell discussion messages, not submitted drive approval requests."/>
  <nav aria-label="Proposal actions" className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:items-center">
   <PageBackLink href="/hr/drives" label="Back to Drives"/>
   <Link href="/hr/drives/new" className="inline-flex min-h-11 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#1a95a1] min-[768px]:min-h-9">Draft another proposal</Link>
  </nav>
  {data.status==="CHOOSE_COLLEGE"?<section className="space-y-3">
   <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Choose a college</h2>
   <NeedsDoingChips label="Authorized colleges:" items={data.choices.map(grant=>({
    key:grant.collegeId,label:grant.collegeName,
    href:"/hr/drives/proposals?collegeId="+encodeURIComponent(grant.collegeId),
   }))}/>
  </section>:data.status==="NO_ACCESS"?<EmptyState title="No active college access" description="No active recruiter college access."/>:<>
   <form action="/hr/drives/proposals" method="get" role="search" aria-label="Search sent drive proposals" className="flex min-w-0 flex-col gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:flex-row min-[768px]:items-end">
    <Input type="hidden" name="collegeId" value={data.collegeId??""}/>
    <label className="min-w-0 flex-[1_1_12rem] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search by role title
     <Input name="q" type="search" maxLength={100} defaultValue={input.data.q}
       className="w-full mt-[6px] block" placeholder="Role title" />
    </label>
    <label className="min-w-0 w-full text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] min-[768px]:w-44">Order
      <Select name="sort" defaultValue={input.data.sort} className="mt-[6px] block">
        <option value="LATEST">Most recent</option>
        <option value="OLDEST">Oldest first</option>
      </Select>
    </label>
    <Button type="submit" variant="secondary" className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">Search</Button>
   </form>
   {data.items.length?<Link
     href={hrSentProposalExportHref({collegeId:data.collegeId!,q:input.data.q,
      page:data.page,sort:input.data.sort})}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     Export this page (summary CSV)
    </Link>:null}
   <p role="status" className="max-w-2xl text-sm text-body leading-[1.6]">
    {data.total.toLocaleString("en-IN")} recorded discussion proposals · Page {data.page} of {data.pages}.
    These are not submitted approval requests.
   </p>
   {data.items.length?<>
    <div className="hidden min-w-0 min-[768px]:block">
      <HrProposalHistoryGrid scopeKey={context.user.id+":"+(data.collegeId??"")}
       rows={data.items.map(row=>({
        id:row.id,title:row.title,reference:row.referenceId,
        sentAt:new Intl.DateTimeFormat("en-IN",{
          dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
        }).format(row.createdAt)+" IST",
        sentAtMs:row.createdAt.getTime(),
        status:"Discussion only — not an approval request",
        threadHref:"/hr/conversations/"+row.threadId,
       }))}/>
    </div>
    <ol className="divide-y divide-border border-y border-border min-[768px]:hidden">
    {data.items.map(row=><li key={row.id}
     className="min-w-0 py-3">
     <Link href={"/hr/conversations/"+row.threadId}
      className="block break-words font-semibold text-primary-text min-h-11 min-[768px]:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{row.title}</Link>
     <p className="mt-2 text-xs text-muted-foreground leading-5">
      Proposal reference: {row.referenceId}
     </p>
     <p className="mt-1 text-xs text-muted-foreground leading-5">
      Sent for discussion on {new Intl.DateTimeFormat("en-IN",{
        dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
      }).format(row.createdAt)} IST
     </p>
     <p className="mt-2 text-xs text-[var(--lms-muted-text)] leading-5">No approval or drive publication is implied.</p>
    </li>)}
   </ol></>:<EmptyState title="No sent proposals" description="No persisted drive proposals for this college. Draft a proposal to start a discussion."
    action={<Link href="/hr/drives/new" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline min-[768px]:min-h-9">Draft another proposal</Link>} />}
   {data.pages>1 ? <nav aria-label="Sent proposal pages" className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:flex-wrap">
    {data.page>1?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page-1})}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] min-[768px]:min-h-9 border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm text-primary-text hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Newer proposals</Link>:null}
    {data.page<data.pages?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page+1})}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] min-[768px]:min-h-9 border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm text-primary-text hover:border-[var(--lms-primary)] hover:bg-[rgba(38,186,199,0.07)] hover:text-[var(--lms-primary-text)] active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Older proposals</Link>:null}
   </nav> : null}
  </>}
 </div>;
}
