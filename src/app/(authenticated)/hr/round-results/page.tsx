import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {StatusBadge} from "@/components/ui/status-badge";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listOwnRecruiterPlacementJobs} from "@/modules/placements/recruiter-service";
import {getRecruiterPlacementWorkspace} from "@/modules/placements/recruiter-workspace-service";
import {projectRecruiterRoundResults,recruiterResultTableHref,recruiterResultTableQuerySchema} from "@/modules/placements/recruiter-round-results-read-model";
type Search={jobId?:string|string[];roundId?:string|string[];outcome?:string|string[]};
export default async function HrRoundResultsPage({searchParams}:{searchParams:Promise<Search>}) {
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) redirect("/dashboard");
 const raw=await searchParams;
 const query=recruiterResultTableQuerySchema.safeParse({jobId:raw.jobId||undefined,
   roundId:raw.roundId||undefined,outcome:raw.outcome||undefined});
 if(!query.success) return <div className="min-w-0 max-w-full space-y-5"><PageHeader eyebrow="Employer Recruiter" title="Round Results" />
   <ErrorState title="Invalid round filters" description="Choose a valid hiring drive, round and outcome filter."
    action={<Link href="/hr/round-results" className="text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear filters</Link>}/></div>;
 if(!query.data.jobId) {
   const jobs=(await listOwnRecruiterPlacementJobs(context)).filter(item=>item.job.archivedAt===null);
   return <div className="min-w-0 max-w-full space-y-6"><PageHeader eyebrow="Employer Recruiter" title="Round Results"
     description="Choose one of your employer's authorized published or closed hiring drives. Private college applications are never listed." />
    {jobs.length?<section className="grid gap-3 sm:grid-cols-2">{jobs.map(item=>
     <Link key={item.job.id} href={recruiterResultTableHref({jobId:item.job.id})}
       className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
       <span className="block font-semibold text-foreground">{item.job.title}</span>
       <span className="mt-1 block text-sm text-body">{item.collegeName} · {item.job.status}</span>
     </Link>)}</section>:<EmptyState title="No hiring drives" description="There are no authorized drives available for round review."/>}
   </div>;
 }
 let workspace:Awaited<ReturnType<typeof getRecruiterPlacementWorkspace>>;
 try {
   workspace=await getRecruiterPlacementWorkspace(context,query.data.jobId);
 } catch(error) {
   if(error instanceof PlacementsServiceError && error.code==="PLACEMENT_JOB_NOT_FOUND") notFound();
   if(error instanceof z.ZodError) notFound();
   throw error;
 }
 const rounds=workspace.rounds;
 const selectedRound=rounds.find(round=>round.id===query.data.roundId) ?? (query.data.roundId?null:rounds[0]??null);
 if(query.data.roundId&&!selectedRound) notFound();
 const results=selectedRound?projectRecruiterRoundResults(rounds,selectedRound.id,query.data.outcome):null;
 const filters=["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"] as const;
 const counts=results?.counts;
 const countValues:Record<(typeof filters)[number],number>={
  ALL:counts?.all??0,RECORDED:counts?.recorded??0,UNRECORDED:counts?.unrecorded??0,
  PASS:counts?.pass??0,FAIL:counts?.fail??0,HOLD:counts?.hold??0,ABSENT:counts?.absent??0,
 };
 return <div className="min-w-0 max-w-full space-y-6">
   <PageHeader eyebrow="Employer Recruiter" title="Round Results"
    description={workspace.company.name+" · "+workspace.college.name+" · "+workspace.job.title} />
   <nav aria-label="Round review navigation" className="flex flex-wrap gap-4 text-sm">
     <Link href="/hr/round-results" className="inline-flex min-h-9 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Choose another drive</Link>
     <Link href={"/hr/placements/jobs/"+workspace.job.id+"?tab=rounds"} className="inline-flex min-h-9 items-center text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Open hiring rounds & staging</Link>
   </nav>
   {rounds.length===0?<EmptyState title="No rounds yet" description="The placement cell has not configured any non-cancelled rounds for this drive."/>:<>
    <section className="border-b border-border pb-4 sm:pb-5">
      <h2 className="font-semibold text-foreground">Choose round</h2>
      <nav aria-label="Hiring rounds" className="mt-3 flex flex-wrap gap-3 border-b border-border">{rounds.map(round=>
       <Link key={round.id} href={recruiterResultTableHref({jobId:workspace.job.id,roundId:round.id})}
         aria-current={round.id===selectedRound?.id?"page":undefined}
         className={round.id===selectedRound?.id?"inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]":"inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>
        {round.sequence}. {round.name}</Link>)}</nav>
    </section>
    {results?<section className="space-y-4 border-b border-border pb-4 sm:pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold text-foreground">{results.round.name}</h2>
        <p className="mt-1 text-sm text-body">{results.round.kind} · {results.round.status} · {counts?.all??0} eligible, shared candidates</p></div>
        <StatusBadge>{results.round.status}</StatusBadge>
      </div>
      {results.round.kind==="TALK"?<p className="text-sm text-muted-foreground">Informational rounds do not collect outcomes.</p>:<>
       <nav aria-label="Outcome" className="flex flex-wrap gap-3 border-b border-border">{filters.map(filter=>
        <Link key={filter} href={recruiterResultTableHref({jobId:workspace.job.id,roundId:results.round.id,outcome:filter})}
          aria-current={query.data.outcome===filter?"page":undefined}
          className={query.data.outcome===filter?"inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]":"inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-body hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}>
          {filter.replaceAll("_"," ")} ({countValues[filter]})</Link>)}</nav>
       {results.rows.length?<div className="grid gap-3 md:grid-cols-2">
         {results.rows.map(row=><article key={row.key} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-4">
           <h3 className="break-words font-semibold text-foreground">{row.name}</h3>
           <div className="mt-2 flex flex-wrap gap-2"><StatusBadge>{row.outcome??"NOT RECORDED"}</StatusBadge>
              {row.outcome?<StatusBadge>{row.status}</StatusBadge>:null}</div>
           {row.scorePercent!==null?<p className="mt-2 text-sm text-body">Score: {row.scorePercent}%</p>:null}
           {row.waitlistRank!==null?<p className="mt-1 text-sm text-body">Waitlist rank: {row.waitlistRank}</p>:null}
         </article>)}</div>:<p className="text-sm text-muted-foreground">No shared candidates match this outcome.</p>}
       <p className="text-xs text-muted-foreground">STAGED results are awaiting placement-cell review; APPLIED results are recorded decisions. This read-only table does not submit or notify applicants.</p>
      </>}
    </section>:null}
   </>}
 </div>;
}
