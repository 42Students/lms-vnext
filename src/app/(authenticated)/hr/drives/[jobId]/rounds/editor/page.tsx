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
   actions={<nav aria-label="Drive round links" className="flex flex-wrap items-center gap-2 text-sm">
    <PageBackLink href={"/recruiter/drives/"+jobId+"?tab=rounds"} label="Back to drive rounds"/>
    <Link href="/hr/drives" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Back to Drives</Link>
   </nav>} />
  <section id="add-round" className="min-w-0 border-b border-border pb-4">
   <details open={rounds.length===0} className="min-w-0">
    <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-[var(--lms-heading)] text-[var(--lms-font-xl)] leading-[30px] min-[768px]:min-h-9 min-[768px]:text-[22px] min-[768px]:leading-[32px] min-[992px]:text-[var(--lms-font-3xl)] min-[992px]:leading-[40px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Add a round</summary>
    <div className="mt-3 min-w-0">
   <form action={endpoint} method="post" className="grid min-w-0 gap-3 md:grid-cols-2">
    <Input type="hidden" name="action" value="CREATE"/>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round name
     <Input name="name" required maxLength={100} className="w-full"/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Round kind
     <Select name="kind" required defaultValue="INTERVIEW" className="w-full">
      {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
     <Select name="mode" defaultValue="" className="w-full">
      <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
     </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Duration (minutes)
     <Input name="durationMinutes" type="number" min={1} max={1440} className="w-full"/>
    </label>
    <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 md:col-span-2 md:w-auto md:justify-self-start">Add round</Button>
   </form>
    </div>
   </details>
  </section>
  <section className="min-w-0 space-y-3">
   <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-xl)] leading-[30px] min-[768px]:text-[22px] min-[768px]:leading-[32px] min-[992px]:text-[var(--lms-font-3xl)] min-[992px]:leading-[40px]">Current rounds ({rounds.length})</h2>
   {rounds.length===0?<EmptyState title="No hiring rounds" description="This drive has no hiring rounds. Add a round using the form above."
    action={<Link href="#add-round" className="inline-flex min-h-11 items-center text-primary-text underline min-[768px]:min-h-9">Add a round</Link>} />:null}
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
    className={"min-w-0 scroll-mt-24 space-y-2 border-b border-border py-4 "+
     (round.editable?"":"md:hidden")}>
    <div className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between md:hidden"><h3 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[26px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[28px] min-[992px]:text-[var(--lms-font-xl)] min-[992px]:leading-[30px]">{round.sequence}. {round.name}</h3>
     <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-body">{round.kind} · <StatusBadge tone={round.status==="PENDING"?"warning":round.status==="COMPLETED"?"success":"neutral"}>{round.status}</StatusBadge></span></div>
    {round.editable?<details className="min-w-0">
     <summary className="flex min-h-11 min-w-0 cursor-pointer items-center break-words font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Change {round.sequence}. {round.name}</summary>
     <form action={endpoint} method="post" className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
      <Input type="hidden" name="action" value="UPDATE"/><Input type="hidden" name="roundId" value={round.id}/>
      <Input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}/>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name
       <Input name="name" required defaultValue={round.name} maxLength={100} className="w-full"/>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Kind
       <Select name="kind" defaultValue={round.kind} className="w-full">
        {KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
       </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Mode
       <Select name="mode" defaultValue={round.mode??""} className="w-full">
        <option value="">Not scheduled</option><option value="ON_CAMPUS">On campus</option><option value="VIRTUAL">Virtual</option>
       </Select>
      </label>
      <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-9 md:w-auto md:justify-self-start">Save changes</Button>
     </form>
     </details>:<p className="text-sm text-muted-foreground">Managed by placement cell, contains interview slots/results, or is no longer pending; editing is disabled.</p>}
    {round.editable?<Link
      href={"/recruiter/drives/"+jobId+"/rounds/editor/remove/"+round.id}
      className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:hidden md:min-h-9">
      Review round removal
    </Link>:null}
   </article>)}
  </section>
 </div>;
}
