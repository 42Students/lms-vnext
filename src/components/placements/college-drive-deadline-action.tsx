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
    body:JSON.stringify({deadline:deadline.toISOString(),confirmed:true}),
   });
   const result=await response.json().catch(()=>null);
   if(!response.ok)throw Error(result?.error??"Could not extend deadline");
   setDone("Deadline extended to "+new Intl.DateTimeFormat("en-IN",{
    dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(result.deadline))+".");
   setOpen(false);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Could not extend deadline");}
  finally{setBusy(false);}
 }
 return <div className="inline-block">
  <Button variant="secondary" type="button" onClick={()=>{setOpen(true);setError("");}}
   >Extend deadline</Button>
  {done?<p role="status" className="text-xs">{done}</p>:null}
  <Dialog open={open} onOpenChange={next=>{if(!next&&!busy)setOpen(false);}} title={"Extend deadline — "+title} dismissible={!busy}>
    <h2 className="text-lg font-semibold">Extend deadline — {title}</h2>
    <p className="text-sm">Current deadline: {current}</p>
    <p className="text-sm text-body">Extend deadline for {title}?</p>
    <label className="grid gap-1 text-sm">New application deadline (IST)
     <Input type="datetime-local" value={value} onChange={e=>setValue(e.target.value)}
      />
    </label>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    <div className="flex gap-3">
     <Button type="button" disabled={busy||!value} onClick={()=>void save()}
      >
      {busy?"Extending…":"Extend"}</Button>
     <Button variant="secondary" type="button" disabled={busy} onClick={()=>setOpen(false)}
      >Cancel</Button>
    </div>
  </Dialog>
 </div>;
}
