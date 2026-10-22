"use client";
import {Dialog} from "@/components/ui/dialog";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
export function CollegeDriveDeadlineAction({jobId,title,currentDeadline}:{
 jobId:string;title:string;currentDeadline:string|null;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [value,setValue]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [done,setDone]=useState("");
 const current=currentDeadline?new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
 }).format(new Date(currentDeadline))+" IST":"Not set";
 async function save(){
  if(!value||busy)return;
  const deadline=new Date(value+"+05:30");
  if(!Number.isFinite(deadline.getTime())){setError("Enter a valid date and time.");return;}
  setBusy(true);setError("");setDone("");
  try{
   const response=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/extend-deadline",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({deadline:deadline.toISOString(),expectedDeadline:currentDeadline,confirmed:true}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw Error(response.status===409
    ?"Drive changed. Refresh its deadline and try again.":result?.error??"Could not extend deadline");
   setDone("Deadline extended to "+new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(result.deadline))+".");
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not extend deadline");}
  finally{setBusy(false);}
 }
 return <div className="inline-flex min-w-0 max-w-full flex-col items-start gap-2">
  <Button variant="secondary" type="button" onClick={()=>{setOpen(true);setError("");}}
   >Extend deadline</Button>
  {done?<p role="status" className="max-w-full break-words text-xs text-body">{done}</p>:null}
  <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)setOpen(false);}} title={"Extend deadline — "+title} dismissible={!busy}>
   <div className="min-w-0 space-y-4">
    <p className="break-words text-sm text-body">Current deadline: {current}</p>
    <p className="break-words text-sm text-body">Extend deadline for {title}?</p>
    <label className="grid min-w-0 gap-[6px] text-[13px] leading-4 font-semibold">New application deadline (IST)
     <Input type="datetime-local" value={value} onChange={e=>setValue(e.target.value)}
      />
    </label>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:w-auto md:[&_button]:min-h-9">
     <Button type="button" disabled={busy||!value} onClick={()=>void save()}
      >
      {busy?"Extending…":"Extend"}</Button>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}
      >Cancel</Button>
    </div>
   </div>
  </Dialog>
 </div>;
}
