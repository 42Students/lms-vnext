"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";

import {useRouter} from "next/navigation";
import Link from "next/link";
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
 const {showToast}=useToast();
 const [offeringId,setOfferingId]=useState("");
 const [courseSearch,setCourseSearch]=useState("");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [visibleToStudents,setVisibleToStudents]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [pathOverrides,setPathOverrides]=useState<Record<string,string>>({});
 const [sequenceOverrides,setSequenceOverrides]=useState<Record<string,number>>({});
 const chosen=options.find(item=>item.offeringId===offeringId);
 const matchingOptions=options.filter(item=>
  [item.courseName,item.courseCode,item.cohortName,item.periodName].join(" ").toLowerCase().includes(courseSearch.trim().toLowerCase())||item.offeringId===offeringId);
 async function create(addAnother:boolean){
  if(busy)return;
  if(!chosen){setError("Select a course");return;}
  if(!name.trim()){setError("Lesson name is required");return;}
  if(name.trim().length>255){setError("Maximum 255 characters");return;}
  setBusy(true);setError("");setNotice("");
  let pathCreated=false;
  try{
   let pathId=pathOverrides[chosen.offeringId]??chosen.pathId;
   if(!pathId){
    pathId=await postRecord("/api/courses/learning-paths",{
     offeringId:chosen.offeringId,
     title:chosen.courseName+" Learning Path",
     description:null,
    },"learningPath");
    setPathOverrides(old=>({...old,[chosen.offeringId]:pathId!}));
    pathCreated=true;
   }
   const next=sequenceOverrides[chosen.offeringId]??chosen.nextSequence;
   await postRecord("/api/courses/lessons",{
    learningPathId:pathId,name:name.trim(),description:description.trim()||null,
    sequence:next,visibleToStudents,
   },"lesson");
   setSequenceOverrides(old=>({...old,[chosen.offeringId]:next+1}));
   const message=`Created lesson “${name.trim()}” in ${chosen.courseName}.`;
   setNotice(message);
   showToast({tone:"success",title:message});
   setName("");setDescription("");setVisibleToStudents(true);
   // Retain the selected course for consecutive lesson creation.
   if(!addAnother){setOfferingId("");setCourseSearch("");}
   router.refresh();
  }catch(cause){
   const reason=cause instanceof Error?cause.message:"Unable to create Lesson.";
   const mapped=reason==="INVALID_REQUEST"?"Lesson name is required":reason==="LESSON_NAME_CONFLICT"?"A lesson with this name already exists.":reason;
   setError((pathCreated?"The Learning Path was saved, but the Lesson was not created. Retry without changing course. ":"")+mapped);
  }finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 md:flex-none">
  <h2 className="text-lg font-semibold text-foreground">Create New Lesson</h2>
  {!options.length?<Alert tone="warning">
   No courses in this college yet. Create an active Course Offering first. Lessons belong to a Course and Batch.{" "}
   <Link href="/college/courses" className="font-semibold underline">Go to Courses</Link>
  </Alert>:null}
  {options.length?<div className="grid gap-3">
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Course
    <Input type="search" value={courseSearch} disabled={busy} onChange={event=>setCourseSearch(event.target.value)}
     placeholder="Search courses" aria-label="Search courses" className="min-h-11 md:min-h-9"/>
    <Select className="min-h-11 md:min-h-9" required aria-label="Select course"
     value={offeringId} disabled={busy}
     onChange={event=>{setOfferingId(event.target.value);setError("");}}>
     <option value="">Select course</option>
     {matchingOptions.map(item=><option key={item.offeringId} value={item.offeringId}>
      {item.courseName} · {item.courseCode} · {item.cohortName} · {item.periodName}
     </option>)}
    </Select>
   </label>
   <p className="text-xs text-muted-foreground leading-5">
    {!chosen?"Select course":chosen.pathId||pathOverrides[chosen.offeringId]?
     "The Lesson will be added to this Course Offering’s active Learning Path.":
     "An active Learning Path will be created for this Course Offering before the Lesson."}
   </p>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Lesson Name
    <Input value={name} onChange={event=>{setName(event.target.value);if(error==="Enter a lesson name")setError("");}}
     maxLength={255} placeholder="e.g., Introduction to Arrays"
     className="min-h-11 md:min-h-9" required/>
   </label>
   <label className="flex min-h-11 items-center gap-3 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
    <Checkbox checked={visibleToStudents} disabled={busy}
     onChange={event=>setVisibleToStudents(event.target.checked)}/>
    Visible to students
   </label>
   {!visibleToStudents?<p className="text-xs text-muted-foreground">This lesson will be hidden from students until you show it.</p>:null}
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description (optional)
    <Textarea value={description} onChange={event=>setDescription(event.target.value)}
     maxLength={5000} rows={3}
     className="min-h-11 md:min-h-9"/>
   </label>
   <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-center">
    <Button type="button" loading={busy} disabled={busy} onClick={()=>void create(false)}
     className="min-h-11 md:min-h-9">
     {busy?"Saving…":"Create Lesson"}
    </Button>
    <Button type="button" disabled={busy} onClick={()=>void create(true)}
     variant="secondary" className="min-h-11 md:min-h-9">
     Create Lesson & Add Another
    </Button>
    <Button type="button" disabled={busy} onClick={()=>{setOfferingId("");setCourseSearch("");setName("");setDescription("");setVisibleToStudents(true);setError("");}}
     variant="secondary" className="min-h-11 md:min-h-9">
     Cancel
    </Button>
   </div>
  </div>:null}
  {error?<div className="flex items-start gap-2"><Alert tone="error"><strong>Lesson was not created.</strong> {error}</Alert>
   <Button type="button" size="sm" variant="ghost" onClick={()=>setError("")} aria-label="Dismiss lesson error">Dismiss</Button>
  </div>:null}
  {notice?<Alert tone="info">{notice}</Alert>:null}
 </section>;
}
