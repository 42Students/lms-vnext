"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
type Choice={id:string;courseId:string;course:string;code:string;section:string};
type Group={id:string;name:string;capacity:number|null};
type Load={deliveries:Choice[];groups:Group[];offerings:{offeringId:string;courseId:string;capacity:number|null}[]};
export function CollegeElectiveOfferingManager({slotId}:{slotId:string}){
 const router=useRouter(),[opened,setOpened]=useState(false),[loading,setLoading]=useState(false);
 const [data,setData]=useState<Load|null>(null),[deliveryId,setDeliveryId]=useState(""),
  [groupId,setGroupId]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),
  [message,setMessage]=useState("");
 const api="/api/academics/elective-slots/"+encodeURIComponent(slotId)+"/offerings";
 async function open(){
  if(opened){setOpened(false);return;}
  setOpened(true);setLoading(true);setError("");setMessage("");
  try{
   const response=await fetch(api,{cache:"no-store"});
   if(!response.ok)throw Error("Unable to load offerings for this slot.");
   const next=await response.json() as Load;
   setData(next);setDeliveryId(next.deliveries[0]?.id??"");setGroupId(next.groups[0]?.id??"");
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to load offerings");}
  finally{setLoading(false);}
 }
 async function add(){
  const delivery=data?.deliveries.find(row=>row.id===deliveryId);
  if(!delivery||!groupId||busy)return;
  if(!window.confirm("Add this elective course and group to the slot?"))return;
  setBusy(true);setError("");setMessage("");
  try{
   const res=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({courseId:delivery.courseId,backedDeliveryId:deliveryId,groupId})});
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Unable to add offering"}));
    throw Error(problem.error??"Unable to add offering");}
   setMessage("Offering added.");router.refresh();setOpened(false);
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to add offering");}
  finally{setBusy(false);}
 }
 return <div className="min-w-0">
  <button type="button" onClick={()=>void open()} className="min-h-10 rounded border border-border px-3 text-sm text-primary-text">
   Add offering</button>
  {opened&&<section aria-label="Add elective offering" className="mt-2 min-w-64 space-y-2 rounded border bg-surface p-3">
   {loading?<p role="status">Loading eligible courses and groups…</p>:null}
   {data?<><p className="text-xs">Existing offerings: {data.offerings.length}</p>
    <label className="block text-sm">Course and class
     <select className="mt-1 w-full rounded border bg-background p-2" value={deliveryId}
      onChange={e=>setDeliveryId(e.target.value)}>
      {data.deliveries.map(o=><option key={o.id} value={o.id}>{o.course} ({o.code}) · {o.section}</option>)}
     </select></label>
    <label className="block text-sm">Elective group (capacity)
     <select className="mt-1 w-full rounded border bg-background p-2" value={groupId}
      onChange={e=>setGroupId(e.target.value)}>
      {data.groups.map(group=><option key={group.id} value={group.id}>{group.name} · {group.capacity??"No cap"}</option>)}
     </select></label>
    {!data.deliveries.length||!data.groups.length?<p role="status" className="text-sm">
     Create an active elective course delivery and an empty elective group before adding an offering.</p>:null}
    <button type="button" onClick={()=>void add()} disabled={busy||!deliveryId||!groupId}
     className="min-h-10 rounded bg-primary px-3 text-sm text-on-primary disabled:opacity-50">Confirm add offering</button>
   </>:null}
   {error&&<p role="alert" className="text-sm text-error">{error}</p>}
   {message&&<p role="status" className="text-sm">{message}</p>}
  </section>}
 </div>;
}
