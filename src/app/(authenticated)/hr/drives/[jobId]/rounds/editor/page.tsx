import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listHrRoundEditorRows} from "@/modules/placements/hr-round-editor-service";
const KINDS=[["TALK","Discussion"],["TEST","Test"],["VENDOR_TEST","Vendor test"],["GD","Group discussion"],["INTERVIEW","Interview"]] as const;
export default async function HrRoundsEditorPage({params}:{
 params:Promise<{jobId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context))redirect("/dashboard");
 const {jobId}=await params;
 if(!z.string().uuid().safeParse(jobId).success)notFound();
 let rounds:Awaited<ReturnType<typeof listHrRoundEditorRows>>;
 try{rounds=await listHrRoundEditorRows(context,jobId);}
 catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 const endpoint="/api/placements/recruiter/drives/"+jobId+"/rounds";
 return <main className="space-y-6">
  <PageHeader eyebrow="Recruiter · Hiring drive" title="Edit hiring rounds"
   description="Add rounds or change/remove only recruiter-created, unused pending rounds. Every accepted change is audited."/>
  <nav className="flex flex-wrap gap-4 text-sm">
   <Link href={"/recruiter/drives/"+jobId+"?tab=rounds"} className="inline-flex min-h-11 items-center text-primary-text">Back to drive rounds</Link>
   <Link href="/hr/drives" className="inline-flex min-h-11 items-center text-primary-text">Back to Drives</Link>
  </nav>
  <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
   <h2 className="font-semibold text-foreground">Add a round</h2>
   <form action={endpoint} method="post" className="grid gap-3 sm:grid-cols-2">
    <input type="hidden" name="action" value="CREATE"/>
    <label className="grid gap-1 text-sm text-body">Round name
     <input name="name" required maxLength={100} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="grid gap-1 text-sm text-body">Round kind
     <select name="kind" required defaultValue="INTERVIEW" className="min-h-11 rounded-md border border-border bg-surface px-3">
      {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm text-body">Mode
     <select name="mode" defaultValue="" className="min-h-11 rounded-md border border-border bg-surface px-3">
      <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
     </select>
    </label>
    <label className="grid gap-1 text-sm text-body">Duration (minutes)
     <input name="durationMinutes" type="number" min={1} max={1440} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
    </label>
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary sm:col-span-2">Add round</button>
   </form>
  </section>
  <section className="space-y-3">
   <h2 className="font-semibold text-foreground">Current rounds ({rounds.length})</h2>
   {rounds.length===0?<p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
    This drive has no hiring rounds. Add a round using the form above.
   </p>:null}
   {rounds.map(round=><article key={round.id} className="space-y-3 rounded-xl border border-border bg-surface p-4">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-foreground">{round.sequence}. {round.name}</h3>
     <span className="text-sm text-body">{round.kind} · {round.status}</span></div>
    {round.editable?<form action={endpoint} method="post" className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="action" value="UPDATE"/><input type="hidden" name="roundId" value={round.id}/>
      <input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}/>
      <label className="grid gap-1 text-sm text-body">Name
       <input name="name" required defaultValue={round.name} maxLength={100} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
      </label>
      <label className="grid gap-1 text-sm text-body">Kind
       <select name="kind" defaultValue={round.kind} className="min-h-11 rounded-md border border-border bg-surface px-3">
        {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
       </select>
      </label>
      <label className="grid gap-1 text-sm text-body">Mode
       <select name="mode" defaultValue={round.mode??""} className="min-h-11 rounded-md border border-border bg-surface px-3">
        <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
       </select>
      </label>
      <button type="submit" className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary">Save changes</button>
     </form>:<p className="text-sm text-muted-foreground">Managed by placement cell, contains interview slots/results, or is no longer pending; editing is disabled.</p>}
    {round.editable?<Link
      href={"/recruiter/drives/"+jobId+"/rounds/editor/remove/"+round.id}
      className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
      Review round removal
    </Link>:null}
   </article>)}
  </section>
 </main>;
}
