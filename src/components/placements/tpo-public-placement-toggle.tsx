"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useToast} from "@/components/ui/toast";
import {useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
export const PUBLIC_PLACEMENT_TOGGLE_ERRORS={
 unavailable:"Public placement publication is unavailable. Contact your administrator.",
 small:"At least five consented learners in an invited, active batch are required.",
 failed:"Couldn't save public placement settings. Please try again.",
} as const;
export function TpoPublicPlacementToggle({enabled,canEnable}:{enabled:boolean;canEnable:boolean}){
 const router=useRouter();
 const {showToast}=useToast();
 const {pending:busy,run}=useGuardedAction({timeoutMs:30000});
 const [message,setMessage]=useState("");
 async function save(){
  setMessage("");
  try{
   await run(async () => {
    const body=new FormData();body.set("enabled",String(!enabled));
    const response=await fetch("/api/placements/tpo/public-placement",{
     method:"POST",body,credentials:"same-origin",redirect:"manual",
    });
    if(response.type==="opaqueredirect"||response.status===303||response.ok){
     showToast({tone:"success",title:enabled?"Your placements page is off":"Your placements page is live"});
     router.refresh();return;
    }
    const payload=await response.json().catch(()=>null) as {error?:string}|null;
    if(response.status===503)throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.unavailable);
    if(payload?.error==="SMALL_COHORT")throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.small);
    throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.failed);
   });
  }catch(error){
   setMessage(error instanceof Error?error.message:PUBLIC_PLACEMENT_TOGGLE_ERRORS.failed);
  }
 }
 return <div className="mt-4 space-y-2">
  <Button variant="primary" type="button" disabled={busy||(!enabled&&!canEnable)} onClick={()=>void save()}
    className="min-h-11 w-full sm:w-auto md:min-h-9">
    {enabled?"Turn placements page off":"Turn placements page on"}
  </Button>
  {message?<InlineNotice tone="info" message={message}/>:null}
 </div>;
}
