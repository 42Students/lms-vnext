"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";

export function MentorProjectCloseoutControl({
  projectId,expectedUpdatedAt,
}:{projectId:string;expectedUpdatedAt:string}){
  const router=useRouter();
  const [checks,setChecks]=useState([false,false,false]);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const labels=[
    "I verified that the final registered delivery is approved.",
    "I informed the project team that this project will be completed.",
    "I confirm that completing this project is intended.",
  ];
  async function submit(){
    if(!checks.every(Boolean) || !window.confirm(
      "Complete this project? This updates its registered status to COMPLETED.",
    )) return;
    setPending(true);setError(null);
    try{
      const response=await fetch(
        "/api/projects/"+encodeURIComponent(projectId)+"/complete",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            expectedUpdatedAt,confirmDeliveryReviewed:true,
            confirmTeamNotified:true,confirmCloseout:true,
          }),
        },
      );
      if(!response.ok) throw new Error(
        response.status===409?"Project changed. Refresh and review again.":"Completion was not accepted.",
      );
      router.refresh();
    }catch(e){setError(e instanceof Error?e.message:"Retry after refreshing.");}
    finally{setPending(false);}
  }
  return <div className="space-y-3">
    {labels.map((label,i)=><label key={label}
      className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm text-body">
      <input type="checkbox" checked={checks[i]??false}
        onChange={event=>setChecks(old=>old.map((v,j)=>i===j?event.target.checked:v))}
        className="mt-1" />{label}
    </label>)}
    <button type="button" onClick={submit} disabled={pending||!checks.every(Boolean)}
      className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {pending?"Completing…":"Confirm project completion"}
    </button>
    {error&&<p role="alert" className="text-sm text-error">{error}</p>}
  </div>;
}
