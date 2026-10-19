"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {useRouter} from "next/navigation";
import {useState} from "react";

type Offering={
 offeringId:string;courseName:string;courseCode:string;cohortName:string;
 periodName:string;pathId:string|null;nextSequence:number;
};

type ApiRecord={id?:unknown};
async function postRecord(url:string,payload:unknown,key:"learningPath"|"lesson"){
 const response=await fetch(url,{
  method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
 });
 const body:unknown=await response.json().catch(()=>null);
 if(!response.ok){
  const reason=body&&typeof body==="object"&&"error" in body?
   String(body.error):"The change could not be saved.";
  throw Error(reason);
 }
 const record=body&&typeof body==="object"&&key in body?
  (body as Record<string,unknown>)[key] as ApiRecord:null;
 if(!record||typeof record.id!=="string")
  throw Error("The save result could not be confirmed. Reload before trying again.");
 return record.id;
}

/** Direct College Admin lesson authoring, with an on-demand learning path. */
export function CollegeLessonCreateControl({options}:{options:Offering[]}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [offeringId,setOfferingId]=useState(options[0]?.offeringId??"");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [pathOverrides,setPathOverrides]=useState<Record<string,string>>({});
 const [sequenceOverrides,setSequenceOverrides]=useState<Record<string,number>>({});
 const chosen=options.find(item=>item.offeringId===offeringId)??options[0];
 async function create(addAnother:boolean){
  if(busy||!chosen||!name.trim())return;
  setBusy(true);setError("");setNotice("");
  try{
   let pathId=pathOverrides[chosen.offeringId]??chosen.pathId;
   if(!pathId){
    pathId=await postRecord("/api/courses/learning-paths",{
     offeringId:chosen.offeringId,
     title:chosen.courseName+" Learning Path",
     description:null,
    },"learningPath");
    setPathOverrides(old=>({...old,[chosen.offeringId]:pathId!}));
   }
   const next=sequenceOverrides[chosen.offeringId]??chosen.nextSequence;
   await postRecord("/api/courses/lessons",{
    learningPathId:pathId,name:name.trim(),description:description.trim()||null,
    sequence:next,
   },"lesson");
   setSequenceOverrides(old=>({...old,[chosen.offeringId]:next+1}));
   setNotice("Lesson created.");
   setName("");setDescription("");
   if(!addAnother)setOpen(false);
   router.refresh();
  }catch(cause){
   setError(cause instanceof Error?cause.message:"Unable to create Lesson.");
  }finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <h2 className="font-semibold text-foreground">Lessons</h2>
   <Button type="button" onClick={()=>{setOpen(value=>!value);setError("");}}
    disabled={!options.length||busy}
    className="min-h-11">
    Create New Lesson
   </Button>
  </div>
  {!options.length?<p className="text-sm text-muted-foreground">
   Create an active Course Offering first. Lessons belong to a Course and Batch.
  </p>:null}
  {open&&chosen?<div className="grid gap-3">
   <label className="grid gap-1 text-sm font-semibold text-body">Course
    <Select className="min-h-11"
     value={chosen.offeringId} disabled={busy}
     onChange={event=>{setOfferingId(event.target.value);setError("");}}>
     {options.map(item=><option key={item.offeringId} value={item.offeringId}>
      {item.courseCode} · {item.courseName} · {item.cohortName} · {item.periodName}
     </option>)}
    </Select>
   </label>
   <p className="text-xs text-muted-foreground">
    {chosen.pathId||pathOverrides[chosen.offeringId]?
     "The Lesson will be added to this Course Offering’s active Learning Path.":
     "An active Learning Path will be created for this Course Offering before the Lesson."}
   </p>
   <label className="grid gap-1 text-sm font-semibold text-body">Lesson Name
    <Input value={name} onChange={event=>setName(event.target.value)} maxLength={255}
     className="min-h-11" required/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Description (optional)
    <Textarea value={description} onChange={event=>setDescription(event.target.value)}
     maxLength={5000} rows={3}
     className="rounded-md border border-border bg-surface p-3 text-foreground"/>
   </label>
   <div className="flex flex-wrap gap-2">
    <Button type="button" disabled={busy||!name.trim()} onClick={()=>void create(false)}
     className="min-h-11">
     {busy?"Saving…":"Create Lesson"}
    </Button>
    <Button type="button" disabled={busy||!name.trim()} onClick={()=>void create(true)}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
     Create Lesson & Add Another
    </Button>
    <Button type="button" disabled={busy} onClick={()=>setOpen(false)}
     className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-body">
     Cancel
    </Button>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
 </section>;
}
