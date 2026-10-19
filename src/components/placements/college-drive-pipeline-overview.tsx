import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import type {getCollegeHiringFunnel} from "@/modules/placements/college-hiring-funnel-service";
import type {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
type Funnel=Awaited<ReturnType<typeof getCollegeHiringFunnel>>;
type Attention=Awaited<ReturnType<typeof getCollegeDriveAttention>>;
const stages=["APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED","WITHDRAWN"] as const;
const labels={APPLIED:"Applied",SHORTLISTED:"Shortlisted",ASSESSMENT:"Assessment",INTERVIEW:"Interview",WAITLISTED:"Waitlisted",OFFERED:"Offered",HIRED:"Hired",REJECTED:"Rejected",WITHDRAWN:"Withdrawn"} as const;
export function CollegeDrivePipelineOverview({jobId,data,attention}:{
 jobId:string;data:Funnel;attention:Attention;
}){
 const base="/college/placements/jobs/"+encodeURIComponent(jobId);
 const flags=attention.categories.filter(x=>x.jobId===jobId);
 return <div className="space-y-5">
  <nav className="flex flex-wrap gap-3" aria-label="Drive quick actions">
   <Link href={base+"/applications"} className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Applications</Link>
   <Link href={base+"/interviews"} className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Schedule</Link>
   <Link href={base+"/settings"} className="inline-flex min-h-11 items-center rounded border border-border px-4 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">Edit</Link>
  </nav>
  <section className="space-y-3" aria-label="College application pipeline">
   <h2 className="text-lg font-semibold">Application pipeline</h2>
   <p className="text-xs text-muted-foreground">These are current registered College Admin application stages, not cumulative funnel conversions.</p>
   <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
    {stages.map(stage=><StatTile key={stage} href={base+"/applications?stage="+stage}
      label={labels[stage]} value={data.totals[stage]??0}>
      <span className="mt-2 block text-xs text-primary-text underline">View applications</span>
    </StatTile>)}
   </div>
  </section>
  <section aria-label="Drive needs attention" className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold">Needs attention ({flags.length})</h2>
   {!flags.length?<p className="mt-2 text-sm text-muted-foreground">No recorded attention flags for this drive.</p>:
    <ul className="mt-3 space-y-2">{flags.map(flag=><li key={flag.category}>
      <Link href={flag.href} className="font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">
       {flag.category==="STALE_APPLIED"?"Applications with no action in a week":
        flag.category==="INTERVIEW_UNSCHEDULED"?"Marked Interview, nothing scheduled":"Closing soon, low conversion"}
      </Link>
      <span className="ml-2 text-sm">{flag.count} candidate(s)</span>
    </li>)}</ul>}
   <p className="mt-3 text-xs text-muted-foreground">Missing offer-letter evidence is not inferred without a registered private document record.</p>
  </section>
 </div>;
}
