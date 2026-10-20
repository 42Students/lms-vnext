import {PageBackLink} from "@/components/ui/page-back-link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasActiveRecruiter} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {StatusBadge} from "@/components/ui/status-badge";
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
  <PageHeader title="Confirm unused round removal"
   description="Only an unused, pending recruiter-created round can be cancelled. The record remains in audit history."
   actions={<PageBackLink href={"/recruiter/drives/"+encodeURIComponent(jobId)+"/rounds/editor"} label="Keep round"/>}/>
  <div className="border-b border-border pb-5">
   <p className="font-semibold text-foreground">{round.sequence}. {round.name}</p>
   <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-body">{round.kind} · <StatusBadge tone="warning">{round.status}</StatusBadge> · No recorded candidate results.</p>
  </div>
  <div className="flex flex-wrap gap-3">
   <form method="post" action={"/api/placements/recruiter/drives/"+jobId+"/rounds"}>
    <Input type="hidden" name="action" value="REMOVE"/>
    <Input type="hidden" name="roundId" value={round.id}/>
    <Input type="hidden" name="expectedUpdatedAt" value={round.updatedAt.toISOString()}/>
    <Button type="submit" variant="danger">
     Confirm remove
    </Button>
   </form>
  </div>
 </div>;
}
