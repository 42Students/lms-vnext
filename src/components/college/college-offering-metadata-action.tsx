"use client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
export function CollegeOfferingMetadataAction({offering}:{
  offering:{id:string;courseName:string;type:"CORE"|"ELECTIVE";credits:number|null;
    displayOrder:number;updatedAt:string};
}) {
  const router=useRouter();
  const {ask,confirmation}=useCollegeConfirmation();
  const [open,setOpen]=useState(false),[pending,start]=useTransition(),[error,setError]=useState("");
  const [type,setType]=useState<"CORE"|"ELECTIVE">(offering.type);
  const [credits,setCredits]=useState(offering.credits===null?"":String(offering.credits));
  const [displayOrder,setDisplayOrder]=useState(String(offering.displayOrder));
  async function save(){
    if(!(await ask("Save course offering metadata for "+offering.courseName+
      "? Type and credit edits are blocked when active deliveries depend on this offering.")))return;
    setError("");
    start(async()=>{
      try{
        const body={type,credits:credits.trim()?Number(credits):null,
          displayOrder:Number(displayOrder),expectedUpdatedAt:offering.updatedAt,confirm:true};
        const response=await fetch("/api/college/offerings/"+encodeURIComponent(offering.id)+"/metadata",{
          method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body),
        });
        if(!response.ok){
          const payload=await response.json().catch(()=>({error:"OFFERING_EDIT_FAILED"})) as {error?:string};
          throw new Error(payload.error??"OFFERING_EDIT_FAILED");
        }
        setOpen(false);router.refresh();
      }catch(err){setError(err instanceof Error?err.message:"Offering edit failed");}
    });
  }
  return <div className="space-y-1">{confirmation}
    <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(true)}
      className="min-h-11 md:min-h-9">Edit</Button>
    <Dialog open={open} onOpenChange={next=>{if(!next&&!pending)setOpen(false);}} title={"Edit offering "+offering.courseName} dismissible={!pending}>
        <label className="grid gap-1 text-sm font-semibold text-body">Offering type
          <Select value={type} disabled={pending} onChange={e=>setType(e.target.value as "CORE"|"ELECTIVE")}>
            <option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
          </Select></label>
        <label className="grid gap-1 text-sm font-semibold text-body">Credits (optional)
          <Input type="number" min={1} max={30} value={credits} disabled={pending}
            onChange={e=>setCredits(e.target.value)}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Display order
          <Input type="number" min={0} max={10000} required value={displayOrder} disabled={pending}
            onChange={e=>setDisplayOrder(e.target.value)}/>
        </label>
        {error?<Alert tone="error">{error}</Alert>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" type="button" onClick={()=>setOpen(false)} disabled={pending}
            className="min-h-11 md:min-h-9">Cancel</Button>
          <Button variant="primary" type="button" onClick={save} disabled={pending}
            className="min-h-11 md:min-h-9" loading={pending}>
            {pending?"Saving…":"Confirm edit"}</Button>
        </div>
    </Dialog>
    {!open&&error?<Alert tone="error">{error}</Alert>:null}
  </div>;
}
