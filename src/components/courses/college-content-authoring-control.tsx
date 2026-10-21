"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {LessonResourceMaterialsControl} from "./lesson-resource-materials-control";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Existing={id:string;lessonId:string;offeringId:string;lessonName:string;courseCode:string;deliveryId:string|null;title:string;externalUrl:string|null;notes:string|null;
 durationSeconds:number|null;startsAt:string|null;endsAt:string|null;status:string;sequence:number;visibleToStudents:boolean};
type Kind="YOUTUBE"|"LIVE_CLASS"|"RESOURCE";
type Delivery={deliveryId:string;offeringId:string;sectionName:string;sectionCode:string};
type MeetingZone=string;
const MEETING_ZONES=["Asia/Kolkata","UTC","America/New_York","America/Chicago",
 "America/Los_Angeles","Europe/London","Europe/Paris","Asia/Dubai",
 "Asia/Singapore","Asia/Tokyo","Australia/Sydney","Pacific/Auckland"] as const;
const dateInput=(iso:string|null,zone:MeetingZone="Asia/Kolkata")=>iso?new Intl.DateTimeFormat("sv-SE",{
 timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",
 hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(new Date(iso)).replace(" ","T"):"";
/** Convert an IANA wall time without silently accepting nonexistent or duplicated
 * local clock instants across daylight-saving transitions. No fixed offsets. */
function isoIst(local:string,zone:MeetingZone="Asia/Kolkata"){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
  throw Error("Enter date and time");
 try{new Intl.DateTimeFormat("en-US",{timeZone:zone}).format(new Date());}
 catch{throw Error("Enter a valid IANA Time Zone");}
 const instant=Date.parse(local+":00Z");
 if(Number.isNaN(instant))throw Error("Enter a valid date and time");
 const matches:string[]=[];
 for(let minutes=-840;minutes<=840;minutes+=15){
  const candidate=new Date(instant+minutes*60_000);
  if(dateInput(candidate.toISOString(),zone)===local)matches.push(candidate.toISOString());
 }
 if(!matches.length)throw Error("This local time does not exist in the selected Time Zone (DST change).");
 if(matches.length>1)throw Error("This local time occurs twice due to a daylight-saving change. Choose another time.");
 return matches[0]!;
}
export function CollegeContentAuthoringControl({kind,lessons,deliveries,existing,existingTruncated=false,existingPage=1,existingFilters,materialsEnabled=false}:{
 kind:Kind;lessons:Lesson[];deliveries:Delivery[];existing:Existing[];existingTruncated?:boolean;
 existingPage?:number;existingFilters?:{courseId:string;lessonId:string;sectionId:string;search:string};
 materialsEnabled?:boolean;
}){
 const router=useRouter(),[editing,setEditing]=useState<string|null>(null),[open,setOpen]=useState(false);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??""),[title,setTitle]=useState(""),
  [url,setUrl]=useState(""),[notes,setNotes]=useState(""),[duration,setDuration]=useState(""),
  [start,setStart]=useState(""),[end,setEnd]=useState(""),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [visibleToStudents,setVisibleToStudents]=useState(true);
 const [initialDraft,setInitialDraft]=useState("");
 const [discardOpen,setDiscardOpen]=useState(false);
 const [newResourceId,setNewResourceId]=useState<string|null>(null);
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const [orderDraft,setOrderDraft]=useState<Record<string,string>>({});
 const [listCourseId,setListCourseId]=useState(existingFilters?.courseId??"");
 const [listLessonId,setListLessonId]=useState(existingFilters?.lessonId??"");
 const [listQuery,setListQuery]=useState(existingFilters?.search??"");
 const [listSectionId,setListSectionId]=useState(existingFilters?.sectionId??"");
 const [removeLink,setRemoveLink]=useState(false);
 const [openMaterialsId,setOpenMaterialsId]=useState<string|null>(null);
 const [deliveryId,setDeliveryId]=useState("");
 const [timeZone,setTimeZone]=useState<MeetingZone>("Asia/Kolkata");
 const selectedLesson=lessons.find(row=>row.id===lessonId);
 const allowedDeliveries=deliveries.filter(row=>row.offeringId===selectedLesson?.offeringId);
 const listOfferingId=lessons.find(lesson=>lesson.id===listLessonId)?.offeringId??
   existing.find(item=>item.lessonId===listLessonId)?.offeringId;
 const listSections=deliveries.filter(row=>(!listCourseId||row.offeringId===listCourseId)&&
  (!listLessonId||listOfferingId===row.offeringId));
 const matching=existing.filter(item=>(!listCourseId||item.offeringId===listCourseId)&&(!listQuery.trim()||[item.title,item.lessonName,item.courseCode].some(value=>
  value.toLocaleLowerCase().includes(listQuery.trim().toLocaleLowerCase())))&&
  (!listLessonId||item.lessonId===listLessonId)&&
  (!listSectionId||!item.deliveryId||item.deliveryId===listSectionId)&&
  (!listSectionId||item.offeringId===deliveries.find(row=>row.deliveryId===listSectionId)?.offeringId));
 function applyExistingFilters(changes:Record<string,string>){
  const params=new URLSearchParams(window.location.search);
  const current:Record<string,string>={
   existingCourse:listCourseId,existingLesson:listLessonId,
   existingSection:listSectionId,existingSearch:listQuery.trim(),
  };
  for(const [key,value] of Object.entries({...current,...changes})){
   if(value)params.set(key,value);else params.delete(key);
  }
  if(!("existingPage" in changes))params.delete("existingPage");
  router.replace(window.location.pathname+(params.size?"?"+params.toString():""));
 }
 const text=kind==="YOUTUBE"?"Link YouTube video":kind==="RESOURCE"?"Add Resource":"Schedule live class";
 const draft=JSON.stringify({lessonId,title,url,notes,duration,start,end,deliveryId,timeZone,removeLink,visibleToStudents});
 function closeEditor(){
  if(busy)return;
  if(draft!==initialDraft){setDiscardOpen(true);return;}
  setOpen(false);
 }
 function select(item:Existing){
  setEditing(item.id);setOpen(true);setLessonId(item.lessonId);setTitle(item.title);
  setUrl("");setNotes(item.notes??"");setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
  setTimeZone("Asia/Kolkata");setStart(dateInput(item.startsAt));setEnd(dateInput(item.endsAt));setDeliveryId(item.deliveryId??"");setRemoveLink(false);
  setVisibleToStudents(item.visibleToStudents);setDiscardOpen(false);setError("");setMessage("");
  setInitialDraft(JSON.stringify({lessonId:item.lessonId,title:item.title,url:"",notes:item.notes??"",
   duration:item.durationSeconds===null?"":String(item.durationSeconds),
   start:dateInput(item.startsAt),end:dateInput(item.endsAt),deliveryId:item.deliveryId??"",
   timeZone:"Asia/Kolkata",removeLink:false,visibleToStudents:item.visibleToStudents}));
 }
 function fresh(){
  setEditing(null);setOpen(true);setTitle("");setUrl("");setNotes("");setDuration("");setStart("");setEnd("");setTimeZone("Asia/Kolkata");setDeliveryId("");
  setError("");setMessage("");setRemoveLink(false);setVisibleToStudents(true);
  setDiscardOpen(false);
  setInitialDraft(JSON.stringify({lessonId,title:"",url:"",notes:"",duration:"",start:"",end:"",
   deliveryId:"",timeZone:"Asia/Kolkata",removeLink:false,visibleToStudents:true}));
 }
 async function save(){
  if(busy)return;
  if(!title.trim()||!lessonId||title.trim().length>255){
   setError(kind==="RESOURCE"?"Choose a course/lesson and enter a Resource title (1–255 characters).":
    "Choose a Lesson and enter a Title (1–255 characters).");return;
  }
  if(kind==="LIVE_CLASS"&&!editing&&!url.trim()){setError("Enter a Meeting Link.");return;}
  if(kind==="YOUTUBE"&&!editing&&!url.trim()){setError("Enter a YouTube URL.");return;}
  if(kind==="RESOURCE"&&!editing&&!url.trim()&&!notes.trim()){
   setError("Add a file, HTTPS link, or notes before saving.");return;
  }
  if(kind==="RESOURCE"&&editing&&removeLink&&!notes.trim()){setError("Add resource notes before removing the last link.");return;}
  setBusy(true);setError("");setMessage("");
  try{
   if(url.trim()){
    if(url.trim().length>2048)throw Error("Link must be at most 2048 characters.");
    let target:URL;
    try{target=new URL(url);}catch{throw Error("Enter a valid HTTPS link.");}
    if(target.protocol!=="https:")throw Error("Enter a valid HTTPS link.");
    if(target.username||target.password||target.hash)
      throw Error("Remove credentials and fragments from the HTTPS link.");
    const host=target.hostname.toLowerCase().replace(/^\[|\]$/g,"");
    if(host==="localhost"||host.endsWith(".localhost")||host==="::1"||
       host==="0.0.0.0"||host==="::"||host.startsWith("fe80:")||
       /^127(?:\.\d{1,3}){3}$/.test(host)||/^10(?:\.\d{1,3}){3}$/.test(host)||
       /^192\.168(?:\.\d{1,3}){2}$/.test(host)||/^169\.254(?:\.\d{1,3}){2}$/.test(host)||
       /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/.test(host))
      throw Error("Use a publicly reachable HTTPS link.");

    if(kind==="YOUTUBE"&&!["youtube.com","youtu.be"].includes(target.hostname.toLowerCase())&&
      !target.hostname.toLowerCase().endsWith(".youtube.com"))throw Error("Enter a YouTube URL.");
   }
   if(kind==="LIVE_CLASS"&&(!start||!end))throw Error("Enter Start Date and End Date.");
   const extra=kind==="YOUTUBE"?{durationSeconds:Number(duration)}:kind==="RESOURCE"?{notes:notes.trim()||null}:{startsAt:isoIst(start,timeZone),endsAt:isoIst(end,timeZone)};
   if(kind==="YOUTUBE"&&(!duration.trim()||!Number.isInteger(Number(duration))||Number(duration)<1||
    Number(duration)>86400))throw Error("Video length must be 1–86400 seconds.");
   if(kind==="LIVE_CLASS"&&new Date(isoIst(end,timeZone)).getTime()<=new Date(isoIst(start,timeZone)).getTime())
    throw Error("End time must be after start time");
   if(!editing&&deliveryId&&!allowedDeliveries.some(row=>row.deliveryId===deliveryId)){
    setError("Select a Section for this Course.");return;
   }
   if(!editing&&(nextOverride[lessonId]??selectedLesson?.nextSequence??0)>10000){
    setError("This Lesson has reached the content ordering limit.");return;
   }
   if(!window.confirm(editing?"Save changes?":"Create this content?"))return;
   const res=await fetch(editing?"/api/courses/lesson-contents/"+encodeURIComponent(editing):
    "/api/courses/lesson-contents",{method:editing?"PATCH":"POST",
     headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?
      {title:title.trim(),visibleToStudents,...(kind==="RESOURCE"?(removeLink?{externalUrl:null}:(url.trim()?{externalUrl:url.trim()}:{})):(url.trim()?{externalUrl:url.trim()}:{})),...extra}:
      {lessonId,deliveryId:deliveryId||null,title:title.trim(),visibleToStudents,contentType:kind,externalUrl:url.trim()||null,
       sequence:nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0,...extra})});
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Unable to save content"}));
    throw Error(problem.error??"Unable to save content");}
   if(!editing)setNextOverride(old=>({...old,[lessonId]:(nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0)+1}));
   if(!editing&&kind==="RESOURCE"&&materialsEnabled){
    const payload=await res.json().catch(()=>null);
    const id=payload?.content?.id;
    if(typeof id==="string")setNewResourceId(id);
   }
   setMessage(kind==="RESOURCE"?(editing?"Resource updated":"Resource created"):
    editing?"Lesson content updated successfully!":"Content created.");
   setOpen(false);router.refresh();
  }catch(cause){setError((editing?"Failed to update content: ":"Failed to create content: ")+
   (cause instanceof Error?cause.message:"Unable to save content"));}
  finally{setBusy(false);}
 }
 async function saveOrder(item:Existing){
  if(busy)return;
  const entered=Number(orderDraft[item.id]??item.sequence+1);
  if(!Number.isInteger(entered)||entered<1||entered>10001){setError("Enter a valid Order.");return;}
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sequence:entered-1}),
   });
   if(!response.ok){const result=await response.json().catch(()=>null);
    throw Error(result?.error??"Unable to save Order.");}
   setMessage("Order saved.");router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to save Order.");}
  finally{setBusy(false);}
 }
 async function transition(item:Existing,action:"PUBLISH"|"ARCHIVE"){
  if(busy)return;
  if(!window.confirm(action==="PUBLISH"?
    "Publish this content to enrolled students?":
    "Delete this content from student access? The record will be archived."))return;
  setBusy(true);setError("");setMessage("");
  try{
   const response=await fetch("/api/courses/lesson-contents/"+encodeURIComponent(item.id)+"/transition",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action}),
   });
   if(!response.ok){
    const body=await response.json().catch(()=>({error:"Unable to update content"}));
    throw Error(body.error??"Unable to update content");
   }
   if(editing===item.id){setOpen(false);setEditing(null);}
   setMessage(action==="PUBLISH"?"Content published.":kind==="RESOURCE"?
    "Resource deleted (archived; files retained).":"Lesson content deleted successfully! (archived; files retained)");
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content");}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-3 md:flex-none">
  <div className="flex flex-wrap items-center gap-3">
   <h2 className={kind==="LIVE_CLASS"||kind==="RESOURCE"?"sr-only":"font-semibold"}>{kind==="YOUTUBE"?"Video Content":kind==="RESOURCE"?"Resources":"Live Classes"}</h2>
   <Button type="button" variant="secondary" size="sm" disabled={!lessons.length}
    onClick={fresh} className="w-full md:w-auto">{text}</Button>
  </div>
  {!lessons.length&&<p className="text-sm leading-[22px]">Create a course offering, learning path and lesson before adding content.</p>}
  {open&&<div className="grid min-w-0 max-w-3xl gap-4 md:grid-cols-2">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
    <Select className="mt-[6px]" value={selectedLesson?lessonId:""}
     onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}} disabled={Boolean(editing)}>
     {editing&&!selectedLesson?<option value="">Saved Lesson outside authoring picker</option>:null}
     {lessons.map(lesson=><option key={lesson.id} value={lesson.id}>
      {lesson.courseCode} · {lesson.course} · {lesson.name}</option>)}
    </Select></label>
   {editing&&!selectedLesson?<p role="status" className="text-xs text-muted-foreground md:col-span-2 leading-5">
    This saved Lesson is outside the first 250 authoring choices. Its Course and Section association cannot be changed; metadata can still be edited.
   </p>:null}
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
    <Select value={deliveryId} disabled={Boolean(editing)} onChange={e=>setDeliveryId(e.target.value)}
      className="mt-1">
     <option value="">All sections taking this course</option>
     {allowedDeliveries.map(row=><option key={row.deliveryId} value={row.deliveryId}>
      {row.sectionName} ({row.sectionCode})</option>)}
    </Select></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
    <Input required maxLength={255} className="mt-[6px]"
     value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{kind==="YOUTUBE"?"YouTube URL":kind==="RESOURCE"?"HTTPS resource link (optional with notes)":"Meeting Link"}
    <Input type="url" maxLength={2048} required={kind!=="RESOURCE"&&!editing} className="mt-[6px]"
     value={url} onChange={e=>setUrl(e.target.value)} placeholder={editing?"Leave blank to keep saved link":"https://"}/></label>
   {kind==="RESOURCE"?<label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Notes
     <Textarea rows={3} maxLength={5000} value={notes} onChange={e=>setNotes(e.target.value)}
       className="mt-1"/>
    </label>:kind==="YOUTUBE"?<label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Video length (seconds)
    <Input type="number" required placeholder="Actual video duration" min={1} max={86400} value={duration} onChange={e=>setDuration(e.target.value)}
     className="mt-1"/></label>:<>
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Time Zone
     <Select value={timeZone} onChange={event=>{
       const next=event.target.value as MeetingZone;
       if(next===timeZone)return;
       try{
        const startNext=start?dateInput(isoIst(start,timeZone),next):"";
        const endNext=end?dateInput(isoIst(end,timeZone),next):"";
        setStart(startNext);setEnd(endNext);setTimeZone(next);setError("");
       }catch{setError("Fix the Start and End dates before changing Time Zone.");}
      }}
      className="mt-1">
      {MEETING_ZONES.map(zone=><option key={zone} value={zone}>{zone}</option>)}
     </Select>
     <span className="mt-1 block text-xs text-muted-foreground">Changing Time Zone preserves the scheduled instant and converts the displayed dates.</span>
    </label>
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date and Time
     <Input type="datetime-local" required value={start} onChange={e=>setStart(e.target.value)}
      className="mt-1"/></label>
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date and Time
     <Input type="datetime-local" required value={end} onChange={e=>setEnd(e.target.value)}
      className="mt-1"/></label>
   </>}
   <label className="flex items-center gap-2 text-sm md:col-span-2">
    <Checkbox checked={visibleToStudents} disabled={busy}
     onChange={e=>setVisibleToStudents(e.target.checked)}/>
    Visible to students
   </label>
   {kind==="RESOURCE"&&editing?<label className="flex items-center gap-2 text-sm md:col-span-2">
    <Checkbox checked={removeLink} onChange={e=>setRemoveLink(e.target.checked)}/>
    Remove existing resource link
   </label>:null}
   <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 md:col-span-2 md:flex-row md:justify-end">
    <Button type="button" variant="primary" loading={busy} disabled={busy} onClick={()=>void save()}>
     {busy?"Saving…":"Save"}</Button>
    <Button type="button" variant="secondary" disabled={busy} onClick={closeEditor}>Cancel</Button>
   </div>
  </div>}
  <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
   title={kind==="RESOURCE"?"Discard the changes to this resource?":"Discard lesson-content edits?"}
   description="Unsaved changes will be lost." confirmLabel="Discard changes"
   onConfirm={()=>{setDiscardOpen(false);setOpen(false);}}/>
  {kind==="RESOURCE"&&materialsEnabled&&newResourceId?<section className="min-w-0 space-y-3 border-t border-border pt-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm font-semibold">Add materials to your new Resource</p>
    <Button type="button" variant="secondary" size="sm" onClick={()=>setNewResourceId(null)}>Done adding materials</Button>
   </div>
   <LessonResourceMaterialsControl contentId={newResourceId} deliveryId={deliveryId||null} editable/>
  </section>:null}
  {(existing.length>0||existingPage>1||existingTruncated||Boolean(existingFilters?.search))&&<details className="group min-w-0 border-b border-border pb-4"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text md:min-h-9">Existing Content</summary><div className="min-w-0 space-y-3 pt-3">
   {kind==="RESOURCE"&&!materialsEnabled?<p className="text-xs text-muted-foreground leading-5">
    Additional link and file materials are unavailable until the Resource Materials database runtime is verified.
    You can still edit Resource notes and its saved HTTPS link.
   </p>:null}
   {existingTruncated?<p role="status" className="text-xs text-muted-foreground leading-5">
    Showing page {existingPage} of saved items. More content is available through the next page.
   </p>:null}
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Search Existing Content
    <Input type="search" maxLength={100} value={listQuery} onChange={event=>setListQuery(event.target.value)}
     onBlur={()=>applyExistingFilters({existingSearch:listQuery.trim()})}
     onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();applyExistingFilters({existingSearch:listQuery.trim()});}}}
     placeholder="Content title, Lesson or Course code"
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2"/>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Course
    <Select value={listCourseId} onChange={event=>{setListCourseId(event.target.value);setListLessonId("");setListSectionId("");applyExistingFilters({existingCourse:event.target.value,existingLesson:"",existingSection:""});}}
      className="min-h-10 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">All courses</option>
     {[...new Map(lessons.map(lesson=>[lesson.offeringId,
       {id:lesson.offeringId,name:lesson.courseCode+" · "+lesson.course}])).values()]
       .map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Lesson
    <Select value={listLessonId} onChange={event=>{setListLessonId(event.target.value);setListSectionId("");applyExistingFilters({existingLesson:event.target.value,existingSection:""});}}
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">All Lessons</option>
     {lessons.filter(row=>!listCourseId||row.offeringId===listCourseId).map(row=>
       <option key={row.id} value={row.id}>{row.courseCode} · {row.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Section
    <Select value={listSections.some(row=>row.deliveryId===listSectionId)?listSectionId:""}
     onChange={e=>{setListSectionId(e.target.value);applyExistingFilters({existingSection:e.target.value});}}
     className="min-h-10 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">Showing every section&apos;s content together</option>
     {listSections.map(row=><option key={row.deliveryId} value={row.deliveryId}>
      {row.sectionName} ({row.sectionCode})</option>)}
    </Select>
   </label>
   {listSectionId?<p className="text-xs text-muted-foreground leading-5">
    Showing shared offering items and content specific to the selected Section.
    The Order field below is the authored default order, not a Section-specific override.
   </p>:null}
   <p className="text-xs text-muted-foreground leading-5">{matching.length} matching content items on page {existingPage}{existingTruncated?" · more available":""}.</p>
   <div className="flex flex-wrap items-center gap-2" aria-label="Existing content pagination">
    <Button type="button" variant="secondary" size="sm" disabled={existingPage<=1}
     onClick={()=>applyExistingFilters({existingPage:String(existingPage-1)})}>Previous page</Button>
    <span className="text-xs text-muted-foreground">Page {existingPage}</span>
    <Button type="button" variant="secondary" size="sm" disabled={!existingTruncated}
     onClick={()=>applyExistingFilters({existingPage:String(existingPage+1)})}>Next page</Button>
   </div>
   {matching.length===0?<p className="text-xs text-muted-foreground leading-5">No saved items match this Lesson and Section.</p>:null}
   <ul className="space-y-1">{matching.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b p-2 text-sm">
    <span className="break-words">{item.title} <span className="text-xs text-muted-foreground">({item.courseCode} · {item.lessonName} · {item.status} · {item.deliveryId?deliveries.find(row=>row.deliveryId===item.deliveryId)?
        ((deliveries.find(row=>row.deliveryId===item.deliveryId)?.sectionName??"Section")+" ("+
         (deliveries.find(row=>row.deliveryId===item.deliveryId)?.sectionCode??"")+")"):"One section":"All sections taking this course"})</span></span>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     {item.externalUrl&&<a className="underline" target="_blank" rel="noopener noreferrer" href={item.externalUrl}>
      {kind==="YOUTUBE"?"View":kind==="RESOURCE"?"Open link":"Join"}</a>}
     <label className="flex items-center gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Order
      <Input type="number" min={1} max={10001} value={orderDraft[item.id]??String(item.sequence+1)}
       onChange={e=>setOrderDraft(old=>({...old,[item.id]:e.target.value}))}
       className="w-16 rounded border border-border bg-background p-1"/>
     </label>
     <Button type="button" variant="link" disabled={busy} onClick={()=>void saveOrder(item)}>Save order</Button>
     {kind==="RESOURCE"&&materialsEnabled?<Button type="button" className="underline"
      aria-expanded={openMaterialsId===item.id} disabled={busy}
      onClick={()=>setOpenMaterialsId(openMaterialsId===item.id?null:item.id)}>Materials</Button>:null}
     <Button type="button" variant="link" disabled={busy} onClick={()=>select(item)}>Edit</Button>
     {item.status==="DRAFT"&&<Button type="button" variant="primary" disabled={busy}
       onClick={()=>void transition(item,"PUBLISH")}>Publish</Button>}
     <Button type="button" variant="danger" disabled={busy}
       onClick={()=>void transition(item,"ARCHIVE")}>Delete</Button>
    </div>
    {kind==="RESOURCE"&&materialsEnabled&&openMaterialsId===item.id?
      <LessonResourceMaterialsControl key={item.id} contentId={item.id}
       deliveryId={item.deliveryId} editable/>:null}
   </li>)}</ul>
  </div></details>}
  {error&&<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>}
  {message&&<p role="status" className="text-sm leading-[22px]">{message}</p>}
 </section>;
}
