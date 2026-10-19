import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {PlacementsServiceError} from "@/modules/placements/errors";
import {listHrRoundEditorRows} from "@/modules/placements/hr-round-editor-service";
export default async function HrRoundRemovalConfirm({params}:{
 params:Promise<{jobId:string;roundId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id)redirect("/dashboard");
 const {jobId,roundId}=await params;
 if(!z.string().uuid().safeParse(jobId).success||!z.string().uuid().safeParse(roundId).success)notFound();
 let rounds:Awaited<ReturnType<typeof listHrRoundEditorRows>>;
 try{rounds=await listHrRoundEditorRows(context,jobId);}
 catch(error){if(error instanceof PlacementsServiceError&&error.code==="PLACEMENT_JOB_NOT_FOUND")notFound();throw error;}
 const round=rounds.find(row=>row.id===roundId);
 if(!round||!round.editable)notFound();
 return <div className="min-w-0 max-w-full space-y-5">
  <PageHeader eyebrow="Recruiter · Hiring rounds" title="Confirm unused round removal"
   description="Only an unused, pending recruiter-created round can be cancelled. The record remains in audit history."/>
  <div className="border-b border-border pb-5">
   <p className="font-semibold text-foreground">{round.sequence}. {round.name}</p>
   <p className="mt-2 text-sm text-body">{round.kind} · {round.status} · No recorded candidate results.</p>
  </div>
  <div className="flex flex-wrap gap-3">
   <Link href={"/recruiter/drives/"+jobId+"/rounds/editor"}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Keep round</Link>
   <form method="post" action={"/api/placements/recruiter/drives/"+jobId+"/rounds"}>
    <input type="hidden" name="action" value="REMOVE"/>
    <input type="hidden" name="roundId" value={round.id}/>
    <input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}/>
    <Button type="submit">
     Confirm remove
    </Button>
   </form>
  </div>
 </div>;
}
