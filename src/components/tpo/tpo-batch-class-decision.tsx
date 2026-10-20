"use client";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
export function TpoBatchClassDecision({batchId,classId,initial,expectedVersion,finished}:{
 batchId:string;classId:string;initial:string;expectedVersion:string;finished:boolean;
}){
 const router=useRouter(),[choice,setChoice]=useState<Decision>(
  initial==="ELIGIBLE"?"ELIGIBLE":initial==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED");
 const [reason,setReason]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const inFlightRef=useRef(false);
 const changed=choice!==initial;
 function review(){
  if(busy||!changed||finished)return;
  if(choice==="INELIGIBLE"&&reason.trim().length<3){setError("Provide a reason for ineligible decisions.");return;}
  setConfirmOpen(true);
 }
 async function submit(){
  if(inFlightRef.current||busy||!changed||finished)return;
  inFlightRef.current=true;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/classes/"+encodeURIComponent(classId)+"/decision",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
     decision:choice,expectedVersion,...(choice==="INELIGIBLE"?{reason:reason.trim()}:{}),
    }),
   });
   if(!response.ok)throw new Error(response.status===409?"Class decision changed; refresh and retry.":"Could not save class decision.");
   setConfirmOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Class decision failed.");}
  finally{inFlightRef.current=false;setBusy(false);}
 }
 return <div className="min-w-0 space-y-2">
  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
   <label className="grid min-w-0 gap-1 text-sm font-semibold">Who is in
    <Select value={choice} onChange={e=>{setChoice(e.target.value as Decision);setError("");}} disabled={busy||finished}
     className="min-h-11 w-full min-w-0 md:min-h-9">
     <option value="NOT_DECIDED">Follows the batch</option>
     <option value="ELIGIBLE">Eligible</option>
     <option value="INELIGIBLE">Ineligible</option>
    </Select>
   </label>
  {choice==="INELIGIBLE"?<label className="grid min-w-0 gap-1 text-sm">Reason
   <Textarea className="min-h-20 w-full min-w-0" value={reason} onChange={e=>setReason(e.target.value)} maxLength={200} rows={2}
    disabled={busy||finished} placeholder="Reason for ineligible decision"/>
  </label>:null}
  </div>
  {error?<InlineNotice tone="error" message={error}/>:null}
  <Button type="button" onClick={review} disabled={busy||finished||!changed}
   className="min-h-11 w-full sm:w-auto md:min-h-9">
   {busy?"Saving…":"Save"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy)setConfirmOpen(next);}}
   title={"Set this class to "+choice.replaceAll("_"," ").toLowerCase()+"?"}
   description="Student overrides are not changed."
   confirmLabel="Save" confirmVariant="primary" pending={busy}
   onConfirm={()=>void submit()}/>
 </div>;
}
