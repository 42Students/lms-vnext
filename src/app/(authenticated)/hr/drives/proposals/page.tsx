import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {hrDriveProposalHistoryQuerySchema} from "@/modules/placements/hr-drive-proposal-history-model";
import {listHrDriveProposals} from "@/modules/placements/hr-drive-proposal-history-service";

export default async function RecruiterDriveProposalHistory({
 searchParams,
}:{searchParams:Promise<{collegeId?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const raw=await searchParams;
 const id=Array.isArray(raw.collegeId)?raw.collegeId[0]:raw.collegeId;
 const input=hrDriveProposalHistoryQuerySchema.safeParse({collegeId:id});
 if(!input.success)notFound();
 const data=await listHrDriveProposals(context,input.data);
 return <main className="space-y-5">
  <PageHeader eyebrow="Recruiter · Drives" title="Sent drive proposals"
   description="Private placement-cell discussion messages, not submitted drive approval requests."/>
  <nav className="flex flex-wrap gap-3">
   <Link href="/hr/drives" className="inline-flex min-h-11 items-center text-primary-text">Back to drives</Link>
   <Link href="/hr/drives/new" className="inline-flex min-h-11 items-center text-primary-text">Draft another proposal</Link>
  </nav>
  {data.status==="CHOOSE_COLLEGE"?<section className="space-y-3 rounded-xl border border-border p-4">
   <h2 className="font-semibold">Choose a college</h2>
   {data.choices.map(grant=><Link key={grant.id}
    className="block rounded-md border border-border p-3 text-primary-text"
    href={"/hr/drives/proposals?collegeId="+grant.collegeId}>{grant.collegeName}</Link>)}
  </section>:data.status==="NO_ACCESS"?<p role="status">No active recruiter college access.</p>:<>
   {data.limited?<p role="status" className="rounded-md border border-border p-3 text-sm text-body">
    Showing the 50 most recent proposal messages. Open the conversation for older history.
   </p>:null}
   {data.items.length?<ol className="space-y-3">
    {data.items.map(row=><li key={row.id}
     className="rounded-xl border border-border bg-surface p-4">
     <Link href={"/hr/conversations/"+row.threadId}
      className="block break-words font-semibold text-primary-text">{row.title}</Link>
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
   </ol>:<p role="status" className="rounded-xl border border-border p-5 text-sm text-body">
    No persisted drive proposals for this college. Draft a proposal to start a discussion.
   </p>}
  </>}
 </main>;
}
