"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import {projectMutation} from "./project-api";

export function MentorProjectCloseoutControl({
  projectId,expectedUpdatedAt,
}:{projectId:string;expectedUpdatedAt:string}){
  const router=useRouter();
  const [checks,setChecks]=useState([false,false,false]);
  const [pending,setPending]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const labels=[
    "I verified that the final registered delivery is approved.",
    "I informed the project team that this project will be completed.",
    "I confirm that completing this project is intended.",
  ];
  async function submit(){
    if(pending||!checks.every(Boolean)) return;
    setConfirming(false);
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+"/complete","POST",{
        expectedUpdatedAt,confirmDeliveryReviewed:true,
        confirmTeamNotified:true,confirmCloseout:true,
      });
      router.refresh();
    }catch{setError("Project completion could not be saved. Please check the project status and try again.");}
    finally{setPending(false);}
  }
  return <div className="space-y-3">
    {labels.map((label,i)=><label key={label}
      className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-body">
      <input type="checkbox" checked={checks[i]??false}
        onChange={event=>setChecks(old=>old.map((v,j)=>i===j?event.target.checked:v))}
        className="mt-1" />{label}
    </label>)}
    <Button type="button" onClick={()=>setConfirming(true)} disabled={pending||!checks.every(Boolean)}
      loading={pending}>{pending?"Completing…":"Confirm project completion"}</Button>
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title="Complete this project?"
      description="This updates its registered status to COMPLETED."
      confirmLabel="Complete project" pending={pending} onConfirm={submit}/>
    {error&&<p role="alert" className="text-sm text-error">{error}</p>}
  </div>;
}
