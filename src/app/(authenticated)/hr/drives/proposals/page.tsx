import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
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
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader eyebrow="Recruiter · Drives" title="Sent drive proposals"
   description="Private placement-cell discussion messages, not submitted drive approval requests."/>
  <nav className="flex flex-wrap gap-3">
   <Link href="/hr/drives" className="inline-flex min-h-9 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Back to drives</Link>
   <Link href="/hr/drives/new" className="inline-flex min-h-9 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Draft another proposal</Link>
  </nav>
  {data.status==="CHOOSE_COLLEGE"?<section className="space-y-3">
   <h2 className="font-semibold">Choose a college</h2>
   {data.choices.map(grant=><Link key={grant.id}
    className="block min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9"
    href={"/hr/drives/proposals?collegeId="+grant.collegeId}>{grant.collegeName}</Link>)}
  </section>:data.status==="NO_ACCESS"?<p role="status">No active recruiter college access.</p>:<>
   <form action="/hr/drives/proposals" method="get" className="flex flex-wrap items-end gap-3">
    <input type="hidden" name="collegeId" value={data.collegeId??""}/>
    <label className="min-w-48 flex-1 text-sm text-body">Search by role title
     <Input name="q" maxLength={100} defaultValue={input.data.q}
       className="mt-1 w-full" placeholder="Role title" />
    </label>
    <label className="text-sm text-body">Order
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
     className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
     Export this page (summary CSV)
    </Link>:null}
   <p role="status" className="text-sm text-body">
    {data.total} recorded discussion proposals · Page {data.page} of {data.pages}.
    These are not submitted approval requests.
   </p>
   {data.items.length?<ol className="divide-y divide-border border-y border-border">
    {data.items.map(row=><li key={row.id}
     className="p-4">
     <Link href={"/hr/conversations/"+row.threadId}
      className="block break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">{row.title}</Link>
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
   </ol>:<p role="status" className="py-5 text-sm text-body">
    No persisted drive proposals for this college. Draft a proposal to start a discussion.
   </p>}
   <nav aria-label="Sent proposal pages" className="flex flex-wrap gap-3">
    {data.page>1?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page-1})}
      className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Newer proposals</Link>:null}
    {data.page<data.pages?<Link href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page+1})}
      className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Older proposals</Link>:null}
   </nav>
  </>}
 </div>;
}
