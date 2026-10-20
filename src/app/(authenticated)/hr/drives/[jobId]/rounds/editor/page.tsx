import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import {PageBackLink} from "@/components/ui/page-back-link";
import {HrRoundEditorGrid} from "@/components/hr/hr-round-editor-grid";
import {EmptyState} from "@/components/ui/empty-state";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listHrRoundEditorRows} from "@/modules/placements/hr-round-editor-service";
const KINDS=[["TALK","Discussion"],["TEST","Test"],["VENDOR_TEST","Vendor test"],["GD","Group discussion"],["INTERVIEW","Interview"]] as const;
export default async function HrRoundsEditorPage({params}:{
 params:Promise<{jobId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const {jobId}=await params;
 if(!z.string().uuid().safeParse(jobId).success)notFound();
 let rounds:Awaited<ReturnType<typeof listHrRoundEditorRows>>;
 try{rounds=await listHrRoundEditorRows(context,jobId);}
 catch(error){
  if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();
  throw error;
 }
 const endpoint="/api/placements/recruiter/drives/"+jobId+"/rounds";
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Edit hiring rounds"
   description="Add rounds or change/remove only recruiter-created, unused pending rounds. Every accepted change is audited."
   actions={<nav className="flex flex-wrap items-center gap-2 text-sm">
    <PageBackLink href={"/recruiter/drives/"+jobId+"?tab=rounds"} label="Back to drive rounds"/>
    <Link href="/hr/drives" className="inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to Drives</Link>
   </nav>} />
  <section className="space-y-4 border-b border-border pb-4">
   <h2 className="font-semibold text-foreground">Add a round</h2>
   <form action={endpoint} method="post" className="grid gap-3 md:grid-cols-2">
    <Input type="hidden" name="action" value="CREATE"/>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round name
     <Input name="name" required maxLength={100} className="w-full"/>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round kind
     <Select name="kind" required defaultValue="INTERVIEW" className="w-full">
      {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
     <Select name="mode" defaultValue="" className="w-full">
      <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
     </Select>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Duration (minutes)
     <Input name="durationMinutes" type="number" min={1} max={1440} className="w-full"/>
    </label>
    <Button type="submit" className="md:col-span-2">Add round</Button>
   </form>
  </section>
  <section className="space-y-3">
   <h2 className="font-semibold text-foreground">Current rounds ({rounds.length})</h2>
   {rounds.length===0?<EmptyState title="No hiring rounds" description="This drive has no hiring rounds. Add a round using the form above."/>:null}
   {rounds.length>0?<div className="hidden min-w-0 md:block">
    <HrRoundEditorGrid
     scopeKey={context.user.id+":"+jobId}
     rows={rounds.map(round=>({
       id:round.id,sequence:round.sequence,name:round.name,kind:round.kind,
       mode:round.mode??"Not scheduled",status:round.status,
       duration:round.durationMinutes,editable:round.editable,
       editHref:"#round-edit-"+round.id,
       removeHref:"/recruiter/drives/"+jobId+"/rounds/editor/remove/"+round.id,
     }))}/>
   </div>:null}
   {rounds.map(round=><article id={"round-edit-"+round.id} key={round.id}
    className={"min-w-0 scroll-mt-24 space-y-3 border-b border-border pb-5 last:border-b-0 "+
     (round.editable?"":"md:hidden")}>
    <div className="flex flex-wrap justify-between gap-2 md:hidden"><h3 className="font-semibold text-foreground">{round.sequence}. {round.name}</h3>
     <span className="flex flex-wrap items-center gap-2 text-sm text-body">{round.kind} · <StatusBadge tone={round.status==="PENDING"?"warning":round.status==="COMPLETED"?"success":"neutral"}>{round.status}</StatusBadge></span></div>
    {round.editable?<form action={endpoint} method="post" className="grid gap-3 md:grid-cols-2">
      <h3 className="hidden font-semibold text-foreground md:col-span-2 md:block">Change {round.sequence}. {round.name}</h3>
      <Input type="hidden" name="action" value="UPDATE"/><Input type="hidden" name="roundId" value={round.id}/>
      <Input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}/>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name
       <Input name="name" required defaultValue={round.name} maxLength={100} className="w-full"/>
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Kind
       <Select name="kind" defaultValue={round.kind} className="w-full">
        {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
       </Select>
      </label>
      <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
       <Select name="mode" defaultValue={round.mode??""} className="w-full">
        <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
       </Select>
      </label>
      <Button type="submit">Save changes</Button>
     </form>:<p className="text-sm text-muted-foreground">Managed by placement cell, contains interview slots/results, or is no longer pending; editing is disabled.</p>}
    {round.editable?<Link
      href={"/recruiter/drives/"+jobId+"/rounds/editor/remove/"+round.id}
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:hidden md:min-h-9">
      Review round removal
    </Link>:null}
   </article>)}
  </section>
 </div>;
}
