"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {projectMutation} from "./project-api";
import {useToast} from "@/components/ui/toast";
import styles from "./legacy-project-touch-actions.module.css";

export function MentorProjectCloseoutControl({
  projectId,expectedUpdatedAt,
}:{projectId:string;expectedUpdatedAt:string}){
  const router=useRouter();
  const {showToast}=useToast();
  const [checks,setChecks]=useState([false,false,false]);
  const [pending,setPending]=useState(false);
  const inFlight=useRef(false);
  const [confirming,setConfirming]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const labels=[
    "I verified that the final registered delivery is approved.",
    "I informed the project team that this project will be completed.",
    "I confirm that completing this project is intended.",
  ];
  async function submit(){
    if(pending||inFlight.current||!checks.every(Boolean)) return;
    inFlight.current=true;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/complete","POST",{
        expectedUpdatedAt,confirmDeliveryReviewed:true,
        confirmTeamNotified:true,confirmCloseout:true,
      });
      setConfirming(false);
      showToast({tone:"success",title:"Project completed."});
      router.refresh();
    }catch{setError("Project completion could not be saved. Please check the project status and try again.");}
    finally{inFlight.current=false;setPending(false);}
  }
  return <div className={"space-y-3 "+styles["legacy"]}>
    <div className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
    {labels.map((label,i)=><label key={label}
      className="flex min-h-11 min-w-0 items-start gap-3 py-[var(--lms-space-3)] text-sm text-body">
      <Checkbox disabled={pending} checked={checks[i]??false}
        onChange={event=>setChecks(old=>old.map((v,j)=>i===j?event.target.checked:v))}
        className="mt-1 size-4 accent-[var(--lms-primary)]" />{label}
    </label>)}
    </div>
    <p role="status" className="text-xs text-muted-foreground">{checks.filter(Boolean).length} of 3 confirmations completed</p>
    <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>setConfirming(true)} disabled={pending||!checks.every(Boolean)}
      loading={pending}>{pending?"Completing…":"Confirm project completion"}</Button>
    <ConfirmDialog open={confirming} onOpenChange={open=>{if(!pending)setConfirming(open);}}
      title="Complete this project?"
      description="This updates its registered status to COMPLETED."
      confirmLabel="Complete project" pending={pending} onConfirm={submit}>
      {error?<p role="alert" className="break-words text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    {error&&!confirming?<p role="alert" className="break-words text-sm text-error">{error}</p>:null}
  </div>;
}
