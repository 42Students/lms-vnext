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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { formatNumberIN } from "@/lib/safe-format";
import { istDateTimeFormatter } from "@/lib/format-date";

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
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Sent drive proposals"
   description="Private placement-cell discussion messages, not submitted drive approval requests."/>
  <nav aria-label="Proposal actions" className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center">
   <PageBackLink href="/hr/drives" label="Back to Drives"/>
   <TextLink href="/hr/drives/new" className="inline-flex min-h-11 items-center md:min-h-9">Draft another proposal</TextLink>
  </nav>
  {data.status==="CHOOSE_COLLEGE"?<section className="space-y-3">
   <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Choose a college</Heading>
   <NeedsDoingChips label="Authorized colleges:" items={data.choices.map(grant=>({
    key:grant.collegeId,label:grant.collegeName,
    href:"/hr/drives/proposals?collegeId="+encodeURIComponent(grant.collegeId),
   }))}/>
  </section>:data.status==="NO_ACCESS"?<EmptyState title="No active college access" description="No active recruiter college access."/>:<>
   <form action="/hr/drives/proposals" method="get" role="search" aria-label="Search sent drive proposals" className="flex min-w-0 flex-col gap-[8px] border-b border-[var(--lms-canvas-border)] pb-4 md:flex-row md:items-end">
    <Input type="hidden" name="collegeId" value={data.collegeId??""}/>
    <Label className="min-w-0 flex-[1_1_12rem]">Search by role title
     <Input name="q" type="search" maxLength={100} defaultValue={input.data.q}
       className="w-full mt-[6px] block" placeholder="Role title" />
    </Label>
    <Label className="min-w-0 w-full md:w-44">Order
      <Select name="sort" defaultValue={input.data.sort} className="mt-[6px] block">
        <option value="LATEST">Most recent</option>
        <option value="OLDEST">Oldest first</option>
      </Select>
    </Label>
    <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
   </form>
   {data.items.length?<TextLink
     href={hrSentProposalExportHref({collegeId:data.collegeId!,q:input.data.q,
      page:data.page,sort:input.data.sort})}
     className="inline-flex min-h-11 items-center md:min-h-9">
     Export this page (summary CSV)
    </TextLink>:null}
   <p role="status" className="max-w-2xl text-sm text-body leading-[1.6]">
    {formatNumberIN(data.total)} recorded discussion proposals · Page {data.page} of {data.pages}.
    These are not submitted approval requests.
   </p>
   {data.items.length?<>
    <div className="hidden min-w-0 md:block">
      <HrProposalHistoryGrid scopeKey={context.user.id+":"+(data.collegeId??"")}
       rows={data.items.map(row=>({
        id:row.id,title:row.title,reference:row.referenceId,
        sentAt:istDateTimeFormatter.format(row.createdAt)+" IST",
        sentAtMs:row.createdAt.getTime(),
        status:"Discussion only — not an approval request",
        threadHref:"/hr/conversations/"+row.threadId,
       }))}/>
    </div>
    <ol className="divide-y divide-border border-y border-border md:hidden">
    {data.items.map(row=><li key={row.id}
     className="min-w-0 py-3">
     <TextLink href={"/hr/conversations/"+row.threadId}
      className="block break-words min-h-11 md:min-h-9">{row.title}</TextLink>
     <p className="mt-2 text-xs text-muted-foreground leading-5">
      Proposal reference: {row.referenceId}
     </p>
     <p className="mt-1 text-xs text-muted-foreground leading-5">
      Sent for discussion on {istDateTimeFormatter.format(row.createdAt)} IST
     </p>
     <p className="mt-2 text-xs text-[var(--lms-muted-text)] leading-5">No approval or drive publication is implied.</p>
    </li>)}
   </ol></>:<EmptyState title="No sent proposals" description="No persisted drive proposals for this college. Draft a proposal to start a discussion."
    action={<TextLink href="/hr/drives/new" className="inline-flex min-h-11 items-center md:min-h-9">Draft another proposal</TextLink>} />}
   {data.pages>1 ? <nav aria-label="Sent proposal pages" className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap">
    {data.page>1?<ButtonLink variant="secondary" href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page-1})}>Newer proposals</ButtonLink>:null}
    {data.page<data.pages?<ButtonLink variant="secondary" href={hrSentProposalHistoryHref({collegeId:data.collegeId!,q:input.data.q,sort:input.data.sort,page:data.page+1})}>Older proposals</ButtonLink>:null}
   </nav> : null}
  </>}
 </div>;
}
