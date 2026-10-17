"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export const PUBLIC_PLACEMENT_TOGGLE_ERRORS={
 unavailable:"Public placement publication is unavailable. Contact your administrator.",
 small:"At least five consented learners in an invited, active batch are required.",
 failed:"Couldn't save public placement settings. Please try again.",
} as const;
export function TpoPublicPlacementToggle({enabled,canEnable}:{enabled:boolean;canEnable:boolean}){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function save(){
  setBusy(true);setMessage("");
  try{
   const body=new FormData();body.set("enabled",String(!enabled));
   const response=await fetch("/api/placements/tpo/public-placement",{
    method:"POST",body,credentials:"same-origin",redirect:"manual",
   });
   if(response.type==="opaqueredirect"||response.status===303||response.ok){
    router.refresh();setMessage(enabled?"Your placements page is off":"Your placements page is live");return;
   }
   const payload=await response.json() as {error?:string};
   if(response.status===503)throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.unavailable);
   if(payload.error==="SMALL_COHORT")throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.small);
   throw new Error(PUBLIC_PLACEMENT_TOGGLE_ERRORS.failed);
  }catch(error){
   setMessage(error instanceof Error?error.message:PUBLIC_PLACEMENT_TOGGLE_ERRORS.failed);
  }finally{setBusy(false);}
 }
 return <div className="mt-4 space-y-2">
  <button type="button" disabled={busy||(!enabled&&!canEnable)} onClick={()=>void save()}
    className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {enabled?"Turn placements page off":"Turn placements page on"}
  </button>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </div>;
}
