"use client";
import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type Section={deliveryId:string;sectionName:string;sectionCode:string};
export function FacultyClassSwitcher({currentDeliveryId,sections}:{
 currentDeliveryId:string;sections:readonly Section[];
}){
 const router=useRouter();
 const [selection,setSelection]=useState(currentDeliveryId);
 const [dirty,setDirty]=useState(false);
 const [confirming,setConfirming]=useState(false);
 useEffect(()=>{
  const onDirty=(event:Event)=>{
   if(event instanceof CustomEvent&&typeof event.detail==="boolean")
    setDirty(event.detail);
  };
  window.addEventListener("lms:attendance-dirty",onDirty);
  return ()=>window.removeEventListener("lms:attendance-dirty",onDirty);
 },[]);
 useEffect(()=>setSelection(currentDeliveryId),[currentDeliveryId]);
 function navigate(){
  if(!sections.some(section=>section.deliveryId===selection))return;
  setConfirming(false);
  router.push("/teacher/courses/"+encodeURIComponent(selection)+"/attendanceDetail");
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(selection===currentDeliveryId)return;
  if(dirty)setConfirming(true);
  else navigate();
 }
 return <>
  <form onSubmit={submit} aria-label="Teaching section selector"
    className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-3">
   <label className="grid min-w-[160px] flex-1 gap-1 text-sm font-semibold text-body">
    Class
    <Select aria-label="Select Class" value={selection}
      onChange={event=>setSelection(event.target.value)}
      className="min-h-11 w-full min-w-[160px] md:min-h-9">
     <option value="" disabled>Select Class</option>
     {sections.map(section=><option key={section.deliveryId} value={section.deliveryId}>
      {section.sectionName} ({section.sectionCode})
     </option>)}
    </Select>
   </label>
   <Button type="submit" variant="secondary"
    disabled={!selection||selection===currentDeliveryId}
    className="min-h-11 md:min-h-9">View class</Button>
   <p className="w-full text-xs text-muted-foreground">
    Save changed marks before switching classes.
   </p>
  </form>
  <ConfirmDialog open={confirming} onOpenChange={setConfirming}
   title="Discard attendance changes?"
   description="Your unsaved attendance marks or schedule edits will be lost. Leave this class without saving?"
   confirmLabel="Discard edits and switch class" onConfirm={navigate}/>
 </>;
}
