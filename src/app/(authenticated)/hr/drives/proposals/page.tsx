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
  <nav className="flex flex-wrap gap-2">
   <PageBackLink href="/hr/drives" label="Back to drives"/>
   <Link href="/hr/drives/new" className="inline-flex min-h-11 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9">Draft another proposal</Link>
  </nav>
  {data.status==="CHOOSE_COLLEGE"?<section className="space-y-3">
   <h2 className="text-[16px] font-semibold leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">Choose a college</h2>
   <NeedsDoingChips label="Authorized colleges:" items={data.choices.map(grant=>({
    key:grant.collegeId,label:grant.collegeName,
    href:"/hr/drives/proposals?collegeId="+encodeURIComponent(grant.collegeId),
   }))}/>
  </section>:data.status==="NO_ACCESS"?<EmptyState title="No active college access" description="No active recruiter college access."/>:<>
   <form action="/hr/drives/proposals" method="get" className="flex min-w-0 flex-wrap items-end gap-2 border-b border-[var(--lms-canvas-border)] pb-4">
    <Input type="hidden" name="collegeId" value={data.collegeId??""}/>
    <label className="min-w-0 flex-[1_1_12rem] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search by role title
     <Input name="q" maxLength={100} defaultValue={input.data.q}
       className="mt-1 w-full" placeholder="Role title" />
    </label>
    <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order
      <Select name="sort" defaultValue={input.data.sort} className="mt-1">
        <option value="LATEST">Most recent</option>
        <option value="OLDEST">Oldest first</option>
      </Select>
    </label>
    <Button type="submit" variant="secondary" className="self-end">Search</Button>
   </form>
   {data.items.length?<Link
     href={hrSentProposalExportHref({collegeId:data.collegeId!,q:input.data.q,
      page:data.page,sort:input.data.sort})}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] min-[768px]:min-h-9 border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
     Export this page (summary CSV)
    </Link>:null}
   <p role="status" className="text-sm text-body">
    {data.total} recorded discussion proposals · Page {data.page} of {data.pages}.
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
     className="py-4">
     <Link href={"/hr/conversations/"+row.threadId}
      className="block break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-11 min-[768px]:min-h-9">{row.title}</Link>
     <p className="mt-2 text-xs text-muted-foreground">
      Proposal reference: {row.referenceId}
     </p>
     <p className="mt-1 text-xs text-muted-foreground">
      Sent for discussion on {new Intl.DateTimeFormat("en-IN",{
        dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
      }).format(row.createdAt)} IST
     </p>
     <p className="mt-2 text-xs text-body">No approval or drive publication is implied.</p>
    </li>)}
   </ol></>:<EmptyState title="No sent proposals" description="No persisted drive proposals for this college. Draft a proposal to start a discussion."/>}
   <nav aria-label="Sent proposal pages" className="flex flex-wrap gap-2">
    {data.page>1?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page-1})}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] min-[768px]:min-h-9 border border-border bg-surface px-4 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Newer proposals</Link>:null}
    {data.page<data.pages?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page+1})}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] min-[768px]:min-h-9 border border-border bg-surface px-4 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Older proposals</Link>:null}
   </nav>
  </>}
 </div>;
}
