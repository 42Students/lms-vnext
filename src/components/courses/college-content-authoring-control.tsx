"use client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useEffect,useRef,useState} from "react";
import {LessonResourceMaterialsControl} from "./lesson-resource-materials-control";
import {FacultyLessonVideoManager} from "./faculty-lesson-video-manager";
type Lesson={id:string;name:string;course:string;courseCode:string;offeringId:string;nextSequence:number};
type Existing={id:string;lessonId:string;offeringId:string;lessonName:string;courseCode:string;deliveryId:string|null;title:string;contentType:string;externalUrl:string|null;notes:string|null;
 durationSeconds:number|null;startsAt:string|null;endsAt:string|null;status:string;sequence:number;visibleToStudents:boolean};
type Kind="YOUTUBE"|"LIVE_CLASS"|"RESOURCE";
type Delivery={deliveryId:string;offeringId:string;sectionName:string;sectionCode:string};
type MeetingZone=string;
const MEETING_ZONES = Array.from(new Set([
 "Asia/Kolkata", "UTC",
 ...Intl.supportedValuesOf("timeZone"),
])).sort((left, right) => left.localeCompare(right));
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
function initialLiveSchedule(){
 const tomorrow=new Date(Date.now()+24*60*60_000);
 const start=new Date(tomorrow.getTime()+60*60_000);
 start.setUTCMinutes(Math.ceil(start.getUTCMinutes()/15)*15,0,0);
 const end=new Date(start.getTime()+60*60_000);
 return {start:dateInput(start.toISOString()),end:dateInput(end.toISOString())};
}
export function CollegeContentAuthoringControl({kind,lessons,deliveries,existing,existingTruncated=false,existingPage=1,existingFilters,materialsEnabled=false}:{
 kind:Kind;lessons:Lesson[];deliveries:Delivery[];existing:Existing[];existingTruncated?:boolean;
 existingPage?:number;existingFilters?:{courseId:string;lessonId:string;sectionId:string;search:string;allKindsForReorder?:boolean};
 materialsEnabled?:boolean;
}){
 const router=useRouter(),[editing,setEditing]=useState<string|null>(null),[open,setOpen]=useState(kind!=="RESOURCE"&&lessons.length>0);
 const [lessonId,setLessonId]=useState(lessons[0]?.id??""),[title,setTitle]=useState(""),
  [url,setUrl]=useState(""),[notes,setNotes]=useState(""),[duration,setDuration]=useState(""),
  [start,setStart]=useState(kind==="LIVE_CLASS"?initialLiveSchedule().start:""),
  [end,setEnd]=useState(kind==="LIVE_CLASS"?initialLiveSchedule().end:""),
  [busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [visibleToStudents,setVisibleToStudents]=useState(true);
 const [initialDraft,setInitialDraft]=useState(()=>{
  const times=kind==="LIVE_CLASS"?initialLiveSchedule():{start:"",end:""};
  return JSON.stringify({lessonId:lessons[0]?.id??"",title:"",url:"",notes:"",duration:"",
   start:times.start,end:times.end,deliveryId:"",timeZone:"Asia/Kolkata",
   removeLink:false,visibleToStudents:true,resourceLinks:[],materialDraft:{title:"",externalUrl:"",notes:""},addFileAfterCreate:false,resourceFiles:[]});
 });
 const [pendingArchive,setPendingArchive]=useState<Existing|null>(null);
 const [pendingPublish,setPendingPublish]=useState<Existing|null>(null);
 const [saveConfirmOpen,setSaveConfirmOpen]=useState(false);
 const [courseSearch,setCourseSearch]=useState("");
 const [discardOpen,setDiscardOpen]=useState(false);
 const [newResourceId,setNewResourceId]=useState<string|null>(null);
 const [videoMode,setVideoMode]=useState<"UPLOAD"|"YOUTUBE">("UPLOAD");
 const [nextOverride,setNextOverride]=useState<Record<string,number>>({});
 const [resourceLinks,setResourceLinks]=useState<Array<{title:string;externalUrl:string;notes:string}>>([]);
 const [materialDraft,setMaterialDraft]=useState({title:"",externalUrl:"",notes:""});
 const [addFileAfterCreate,setAddFileAfterCreate]=useState(false);
 const [resourceFiles,setResourceFiles]=useState<File[]>([]);
 const [resourceUploadStatus,setResourceUploadStatus]=useState("");
 const [resourceProgress,setResourceProgress]=useState(0);
 const resourceXhr=useRef<XMLHttpRequest|null>(null);
 useEffect(()=>()=>resourceXhr.current?.abort(),[]);
 const [allKindsForReorder,setAllKindsForReorder]=useState(
  existingFilters?.allKindsForReorder??false);
 const [remoteExisting,setRemoteExisting]=useState<{
  items:Existing[];existingPage:number;existingTruncated:boolean;
 }|null>(null);
 const [existingBusy,setExistingBusy]=useState(false);
 const [existingError,setExistingError]=useState("");
 const scopedRequest=useRef<AbortController|null>(null);
 useEffect(()=>()=>scopedRequest.current?.abort(),[]);
 useEffect(()=>setRemoteExisting(null),[existing,existingPage,existingTruncated,kind]);
 const listRows=remoteExisting?.items??existing;
 const listPage=remoteExisting?.existingPage??existingPage;
 const listMore=remoteExisting?.existingTruncated??existingTruncated;
 function loadExisting(params:URLSearchParams){
  scopedRequest.current?.abort();
  const controller=new AbortController();scopedRequest.current=controller;
  setExistingBusy(true);setExistingError("");
  const url=new URLSearchParams(params);url.set("kind",kind);
  void fetch("/api/courses/college-content-authoring?"+url.toString(),{
   credentials:"same-origin",cache:"no-store",signal:controller.signal,
  }).then(async response=>{
   if(!response.ok)throw Error("Could not refresh the scoped content list.");
   return response.json() as Promise<{
    items:Existing[];existingPage:number;existingTruncated:boolean;
   }>;
  }).then(data=>{if(!controller.signal.aborted)setRemoteExisting(data);})
    .catch(()=>{if(!controller.signal.aborted)setExistingError(
      "Could not load this content page. Previous items are still shown; retry.");})
    .finally(()=>{if(!controller.signal.aborted)setExistingBusy(false);});
 }

 const [listCourseId,setListCourseId]=useState(existingFilters?.courseId??"");
 const [listLessonId,setListLessonId]=useState(existingFilters?.lessonId??"");
 const [listQuery,setListQuery]=useState(existingFilters?.search??"");
 const [listSectionId,setListSectionId]=useState(existingFilters?.sectionId??"");
 const [removeLink,setRemoveLink]=useState(false);
 const [openMaterialsId,setOpenMaterialsId]=useState<string|null>(null);
 const [deliveryId,setDeliveryId]=useState("");
 const [timeZone,setTimeZone]=useState<MeetingZone>("Asia/Kolkata");
 const selectedLesson=lessons.find(row=>row.id===lessonId);
 const courseOptions=[...new Map(lessons.map(row=>[row.offeringId,
  {id:row.offeringId,name:row.course,code:row.courseCode}])).values()];
 const authorCourseId=selectedLesson?.offeringId??"";
 const allowedDeliveries=deliveries.filter(row=>row.offeringId===selectedLesson?.offeringId);
 const listOfferingId=lessons.find(lesson=>lesson.id===listLessonId)?.offeringId??
   listRows.find(item=>item.lessonId===listLessonId)?.offeringId;
 const listSections=deliveries.filter(row=>(!listCourseId||row.offeringId===listCourseId)&&
  (!listLessonId||listOfferingId===row.offeringId));
 const matching=listRows.filter(item=>(!listCourseId||item.offeringId===listCourseId)&&(!listQuery.trim()||[item.title,item.lessonName,item.courseCode].some(value=>
  value.toLocaleLowerCase().includes(listQuery.trim().toLocaleLowerCase())))&&
  (!listLessonId||item.lessonId===listLessonId)&&
  (!listSectionId||!item.deliveryId||item.deliveryId===listSectionId)&&
  (!listSectionId||item.offeringId===deliveries.find(row=>row.deliveryId===listSectionId)?.offeringId));
 function applyExistingFilters(changes:Record<string,string>){
  const params=new URLSearchParams(window.location.search);
  const current:Record<string,string>={
   existingCourse:listCourseId,existingLesson:listLessonId,
   existingSection:listSectionId,existingSearch:listQuery.trim(),
   existingOrderAll:allKindsForReorder?"true":"",
  };
  for(const [key,value] of Object.entries({...current,...changes})){
   if(value)params.set(key,value);else params.delete(key);
  }
  if(!("existingPage" in changes))params.delete("existingPage");
  loadExisting(params);
  router.replace(window.location.pathname+(params.size?"?"+params.toString():""),{scroll:false});
 }
 const text=kind==="YOUTUBE"?"Add a video":kind==="RESOURCE"?"Add Resource":"Schedule a live class";
 const draft=JSON.stringify({lessonId,title,url,notes,duration,start,end,deliveryId,timeZone,removeLink,visibleToStudents,resourceLinks,materialDraft,addFileAfterCreate,resourceFiles:resourceFiles.map(file=>file.name+":"+file.size)});
 function closeEditor(){
  if(busy)return;
  if(draft!==initialDraft){setDiscardOpen(true);return;}
  setOpen(false);
 }
 function select(item:Existing){
  setEditing(item.id);setOpen(true);if(kind==="YOUTUBE")setVideoMode("YOUTUBE");setLessonId(item.lessonId);setTitle(item.title);
  setUrl("");setNotes(item.notes??"");setDuration(item.durationSeconds===null?"":String(item.durationSeconds));
  setTimeZone("Asia/Kolkata");setStart(dateInput(item.startsAt));setEnd(dateInput(item.endsAt));setDeliveryId(item.deliveryId??"");setRemoveLink(false);
  setVisibleToStudents(item.visibleToStudents);setResourceFiles([]);setResourceUploadStatus("");setResourceProgress(0);setAddFileAfterCreate(false);setResourceLinks([]);setMaterialDraft({title:"",externalUrl:"",notes:""});setDiscardOpen(false);setError("");setMessage("");
  setInitialDraft(JSON.stringify({lessonId:item.lessonId,title:item.title,url:"",notes:item.notes??"",
   duration:item.durationSeconds===null?"":String(item.durationSeconds),
   start:dateInput(item.startsAt),end:dateInput(item.endsAt),deliveryId:item.deliveryId??"",
   timeZone:"Asia/Kolkata",removeLink:false,visibleToStudents:item.visibleToStudents,resourceLinks:[],materialDraft:{title:"",externalUrl:"",notes:""},addFileAfterCreate:false,resourceFiles:[]}));
 }
 function fresh(){
  const times=kind==="LIVE_CLASS"?initialLiveSchedule():{start:"",end:""};
  setEditing(null);setOpen(true);setNewResourceId(null);if(kind==="YOUTUBE")setVideoMode("YOUTUBE");setTitle("");setUrl("");setNotes("");setDuration("");
  setStart(times.start);setEnd(times.end);setTimeZone("Asia/Kolkata");setDeliveryId("");
  setError("");setMessage("");setRemoveLink(false);setVisibleToStudents(true);setResourceFiles([]);setResourceUploadStatus("");setResourceProgress(0);setAddFileAfterCreate(false);setResourceLinks([]);setMaterialDraft({title:"",externalUrl:"",notes:""});
  setDiscardOpen(false);
  setInitialDraft(JSON.stringify({lessonId,title:"",url:"",notes:"",duration:"",start:times.start,end:times.end,
   deliveryId:"",timeZone:"Asia/Kolkata",removeLink:false,visibleToStudents:true,resourceLinks:[],materialDraft:{title:"",externalUrl:"",notes:""},addFileAfterCreate:false,resourceFiles:[]}));
 }
 async function uploadResourceFiles(id:string,audience:string|null){
  const root="/api/courses/lesson-contents/"+encodeURIComponent(id)+"/materials/files";
  const mimes:Record<string,string>={pdf:"application/pdf",doc:"application/msword",
   docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",ppt:"application/vnd.ms-powerpoint",
   pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",xls:"application/vnd.ms-excel",
   xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",txt:"text/plain",csv:"text/csv",
   png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",zip:"application/zip"};
  for(const [index,file] of resourceFiles.entries()){
   const ext=file.name.split(".").at(-1)?.toLowerCase()??"";
   if(!mimes[ext]||file.size<1||file.size>50*1024*1024)
    throw Error("Choose an approved Resource file up to 50 MB.");
   setResourceUploadStatus("Uploading "+(index+1)+" of "+resourceFiles.length+": "+file.name);
   setResourceProgress(0);
   const grantResponse=await fetch(root,{method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify({deliveryId:audience,
     originalName:file.name,sizeBytes:file.size,contentType:file.type||mimes[ext],
     title:file.name.replace(/\.[^.]+$/,"").slice(0,255),notes:null})});
   if(!grantResponse.ok)throw Error("Resource saved; could not request a file upload.");
   const payload:unknown=await grantResponse.json();
   if(!payload||typeof payload!=="object"||!("grant" in payload)||!("material" in payload))
    throw Error("Private upload grant was invalid.");
   const {grant,material}=payload as {grant:{uploadUrl:string;method:string;requiredHeaders:Record<string,string>};material:{id:string}};
   if(grant?.method!=="PUT"||!material?.id||typeof grant.uploadUrl!=="string"||
      !grant.requiredHeaders||typeof grant.requiredHeaders!=="object")throw Error("Invalid upload grant.");
   const signed=new URL(grant.uploadUrl);
   if(signed.protocol!=="https:"||signed.username||signed.password)throw Error("Invalid upload URL.");
   let uploaded=false;
   try{
    await new Promise<void>((resolve,reject)=>{
     const xhr=new XMLHttpRequest();resourceXhr.current=xhr;
     xhr.open("PUT",signed.href,true);
     for(const [key,value] of Object.entries(grant.requiredHeaders))xhr.setRequestHeader(key,value);
     xhr.upload.onprogress=e=>{if(e.lengthComputable&&e.total>0)setResourceProgress(Math.round(100*e.loaded/e.total));};
     xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error("File rejected by private storage."));
     xhr.onerror=()=>reject(Error("File upload network error."));
     xhr.onabort=()=>reject(Error("File upload cancelled."));
     xhr.send(file);
    });uploaded=true;
    const confirmation=await fetch(root+"/"+encodeURIComponent(material.id),{method:"POST",
     credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({deliveryId:audience})});
    if(!confirmation.ok)throw Error("File transferred; verify it from the Resource materials list.");
   }catch(cause){
    if(!uploaded)try{await fetch(root+"/"+encodeURIComponent(material.id),{method:"DELETE",
     credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({deliveryId:audience})});}catch{/* Unverified private file remains inaccessible. */}
    throw cause;
   }finally{resourceXhr.current=null;}
  }
  setResourceUploadStatus("Files transferred; security verification may still be pending.");
  setResourceProgress(100);
 }
 async function save(confirmed=false){
  if(busy)return;
  if(!confirmed){setSaveConfirmOpen(true);return;}
  setSaveConfirmOpen(false);
  if(!title.trim()||!lessonId||title.trim().length>255){
   setError(kind==="RESOURCE"?"Choose a course/lesson and enter a Resource title (1–255 characters).":
    "Choose a Lesson and enter a Title (1–255 characters).");return;
  }
  if(kind==="LIVE_CLASS"&&!editing&&!url.trim()){setError("Enter a Meeting Link.");return;}
  if(kind==="YOUTUBE"&&!editing&&!url.trim()){setError("Enter a YouTube URL.");return;}
  if(kind==="RESOURCE"&&!editing&&!url.trim()&&!notes.trim()&&!resourceLinks.length&&!addFileAfterCreate&&!resourceFiles.length){
   setError("Add a file, HTTPS link, or notes before saving.");return;
  }
  if(kind==="RESOURCE"&&!editing&&resourceLinks.length+resourceFiles.length>20){setError("Resources support no more than 20 files and links.");return;}
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
   const extra=kind==="YOUTUBE"?{durationSeconds:Number(duration)}:kind==="RESOURCE"?{notes:notes.trim()||((addFileAfterCreate||resourceFiles.length>0)?"Resource files":null)}:{startsAt:isoIst(start,timeZone),endsAt:isoIst(end,timeZone)};
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
   const res=await fetch(editing?"/api/courses/lesson-contents/"+encodeURIComponent(editing):
    "/api/courses/lesson-contents",{method:editing?"PATCH":"POST",
     headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?
      {title:title.trim(),visibleToStudents,...(kind==="RESOURCE"?(removeLink?{externalUrl:null}:(url.trim()?{externalUrl:url.trim()}:{})):(url.trim()?{externalUrl:url.trim()}:{})),...extra}:
      {lessonId,deliveryId:deliveryId||null,title:title.trim(),visibleToStudents,contentType:kind,externalUrl:url.trim()||null,
       sequence:nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0,...extra,
       ...(kind==="RESOURCE"&&materialsEnabled&&resourceLinks.length?
        {resourceMaterials:resourceLinks.map(item=>({kind:"LINK",title:item.title.trim(),
         externalUrl:item.externalUrl.trim(),notes:item.notes.trim()||null}))}:{})})});
   if(!res.ok){const problem=await res.json().catch(()=>({error:"Unable to save content"}));
    throw Error(problem.error??"Unable to save content");}
   if(!editing)setNextOverride(old=>({...old,[lessonId]:(nextOverride[lessonId]??lessons.find(row=>row.id===lessonId)?.nextSequence??0)+1}));
   if(!editing&&kind==="RESOURCE"&&materialsEnabled){
    const payload=await res.json().catch(()=>null);
    const id=payload?.content?.id;
    if(typeof id==="string"){
     setNewResourceId(id);
     if(resourceFiles.length)try{
      await uploadResourceFiles(id,deliveryId||null);
      setResourceFiles([]);
     }catch(cause){
      setResourceUploadStatus("Resource created. Use the materials editor below to retry any failed files.");
      setError(cause instanceof Error?cause.message:"Resource file upload failed.");
     }
    }
   }
   setResourceLinks([]);
   setMessage(kind==="RESOURCE"?(editing?"Resource updated":"Resource created"):
    editing?"Lesson content updated successfully!":"Content created.");
   setOpen(false);
   loadExisting(new URLSearchParams(window.location.search));router.refresh();
  }catch(cause){setError((editing?"Failed to update content: ":"Failed to create content: ")+
   (cause instanceof Error?cause.message:"Unable to save content"));}
  finally{setBusy(false);}
 }
 async function transition(item:Existing,action:"PUBLISH"|"ARCHIVE",confirmed=false){
  if(busy)return;
  if(!confirmed){
   if(action==="PUBLISH")setPendingPublish(item);
   else setPendingArchive(item);
   return;
  }
  setPendingPublish(null);setPendingArchive(null);
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
   loadExisting(new URLSearchParams(window.location.search));router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Unable to update content");}
  finally{setBusy(false);}
 }
 const editorFields=(
  <div className="grid min-w-0 max-w-3xl gap-4 md:grid-cols-2">
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
    <Input type="search" className="mt-[6px] mb-2" aria-label="Search courses"
      value={courseSearch} onChange={event=>setCourseSearch(event.target.value)} placeholder="Search course"/>
    <Select value={authorCourseId} disabled={Boolean(editing)}
      onChange={event=>{
       const next=lessons.find(lesson=>lesson.offeringId===event.target.value);
       setLessonId(next?.id??"");setDeliveryId("");
      }} className="mt-[6px]">
      <option value="">Select course</option>
      {courseOptions.filter(course=>course.id===authorCourseId||
       (course.name+" "+course.code).toLocaleLowerCase().includes(courseSearch.trim().toLocaleLowerCase()))
       .map(course=><option key={course.id} value={course.id}>{course.name} · {course.code}</option>)}
    </Select>
   </label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Lesson
    <Select className="mt-[6px]" value={selectedLesson?lessonId:""}
     onChange={e=>{setLessonId(e.target.value);setDeliveryId("");}} disabled={Boolean(editing)}>
     {editing&&!selectedLesson?<option value="">Saved Lesson outside authoring picker</option>:null}
     {lessons.filter(lesson=>lesson.offeringId===authorCourseId).map(lesson=><option key={lesson.id} value={lesson.id}>
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
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Content Title
    <Input required maxLength={255} className="mt-[6px]" placeholder="e.g., Introduction Video"
     value={title} onChange={e=>setTitle(e.target.value)}/></label>
   <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{kind==="YOUTUBE"?"YouTube URL":kind==="RESOURCE"?"HTTPS resource link (optional with notes)":"Meeting Link"}
    <Input type="url" maxLength={2048} required={kind!=="RESOURCE"&&!editing} className="mt-[6px]"
     value={url} onChange={e=>setUrl(e.target.value)} placeholder={editing?"Leave blank to keep saved link":"https://"}/></label>
   {kind==="RESOURCE"&&!editing&&materialsEnabled?<fieldset className="space-y-2 rounded-[var(--lms-control-radius)] border border-border p-3 md:col-span-2">
    <legend className="px-2 text-sm font-semibold">Resource materials ({resourceLinks.length}/20)</legend>
    <p className="text-xs text-muted-foreground">Add multiple HTTPS links with individual titles and notes. All links are saved together with the new Resource.</p>
    {resourceLinks.length?<ol className="space-y-1 text-sm">
     {resourceLinks.map((item,index)=><li key={index} className="flex min-w-0 items-center justify-between gap-2 border-b border-border py-1">
      <span className="min-w-0 truncate">{index+1}. {item.title} — {item.externalUrl}</span>
      <Button type="button" variant="ghost" size="sm" disabled={busy}
       onClick={()=>setResourceLinks(rows=>rows.filter((_,at)=>at!==index))}>Remove</Button>
     </li>)}
    </ol>:null}
    <div className="grid gap-2 sm:grid-cols-2">
     <label className="text-xs font-semibold">Link title
      <Input maxLength={255} value={materialDraft.title}
       onChange={event=>setMaterialDraft(old=>({...old,title:event.target.value}))}/></label>
     <label className="text-xs font-semibold">HTTPS link
      <Input type="url" maxLength={2048} value={materialDraft.externalUrl}
       onChange={event=>setMaterialDraft(old=>({...old,externalUrl:event.target.value}))}/></label>
     <label className="text-xs font-semibold sm:col-span-2">Link notes (optional)
      <Textarea rows={2} maxLength={2000} value={materialDraft.notes}
       onChange={event=>setMaterialDraft(old=>({...old,notes:event.target.value}))}/></label>
    </div>
    <Button type="button" variant="secondary" size="sm" disabled={busy||resourceLinks.length>=20}
     onClick={()=>{
      const entry={title:materialDraft.title.trim(),externalUrl:materialDraft.externalUrl.trim(),notes:materialDraft.notes.trim()};
      if(!entry.title){setError("Enter a material title.");return;}
      try{
       const link=new URL(entry.externalUrl);
       const host=link.hostname.toLowerCase();
       if(link.protocol!=="https:"||link.username||link.password||link.hash||!host||
          host==="localhost"||host.endsWith(".localhost")||host==="0.0.0.0"||
          host==="[::1]"||host==="[::]"||/^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(host))
        throw Error("Invalid link");
      }catch{setError("Enter a valid public HTTPS link for this material.");return;}
      if(resourceLinks.some(item=>item.externalUrl.toLowerCase()===entry.externalUrl.toLowerCase())){
       setError("This link is already in the Resource.");return;
      }
      setResourceLinks(rows=>[...rows,entry]);setMaterialDraft({title:"",externalUrl:"",notes:""});setError("");
     }}>Add link to Resource</Button>
   </fieldset>:null}
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
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Start Date
      <Input type="date" required value={start.split("T")[0]??""}
       onChange={event=>setStart(event.target.value+"T"+(start.split("T")[1]||"09:00"))}
       className="mt-1"/>
      <span className="mt-2 block">Start Time</span>
      <Input type="time" required step={900} value={start.split("T")[1]??""}
       onChange={event=>setStart((start.split("T")[0]||dateInput(new Date().toISOString()).split("T")[0])+"T"+event.target.value)}
       className="mt-1"/></label>
    <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">End Date
      <Input type="date" required value={end.split("T")[0]??""}
       onChange={event=>setEnd(event.target.value+"T"+(end.split("T")[1]||"10:00"))}
       className="mt-1"/>
      <span className="mt-2 block">End Time</span>
      <Input type="time" required step={900} value={end.split("T")[1]??""}
       onChange={event=>setEnd((end.split("T")[0]||dateInput(new Date().toISOString()).split("T")[0])+"T"+event.target.value)}
       className="mt-1"/></label>
   </>}
   <label className="flex items-center gap-2 text-sm md:col-span-2">
    <Checkbox checked={visibleToStudents} disabled={busy}
     onChange={e=>setVisibleToStudents(e.target.checked)}/>
    Visible to students
   </label>
   {kind==="RESOURCE"&&!editing&&materialsEnabled?<div className="space-y-2 md:col-span-2">
    <label className="grid gap-2 text-sm font-semibold">Upload files
     <input type="file" multiple disabled={busy} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
      className="block w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm"
      onChange={event=>{
       const files=Array.from(event.currentTarget.files??[]);event.currentTarget.value="";
       const allowed=["pdf","doc","docx","ppt","pptx","xls","xlsx","txt","csv","png","jpg","jpeg","gif","webp","zip"];
       if(files.some(file=>!allowed.includes(file.name.split(".").at(-1)?.toLowerCase()??"")||file.size<1||file.size>50*1024*1024)){
        setError("Choose approved Resource files no larger than 50 MB.");return;}
       if(files.length+resourceFiles.length+resourceLinks.length>20){
        setError("Resources support no more than 20 files and links.");return;}
       setResourceFiles(old=>[...old,...files]);setError("");
      }}/>
    </label>
    {resourceFiles.map((file,index)=><div key={index} className="flex items-center justify-between gap-2 text-xs">
     <span className="truncate">{file.name} · {Math.ceil(file.size/1024)} KB</span>
     <Button type="button" size="sm" variant="ghost" disabled={busy}
      onClick={()=>setResourceFiles(old=>old.filter((_,at)=>at!==index))}>Remove</Button>
    </div>)}
    {resourceUploadStatus?<p role="status" className="text-xs text-muted-foreground">{resourceUploadStatus}</p>:null}
    {busy&&resourceUploadStatus?<progress value={resourceProgress} max={100} className="w-full"/>:null}
    <p className="text-xs text-muted-foreground">After saving the Resource, selected files upload via verified private grants. Scanner-pending files remain unavailable to learners.</p>
   </div>:null}
   {kind==="RESOURCE"&&!editing&&materialsEnabled?<label className="flex items-start gap-2 text-sm md:col-span-2">
    <Checkbox checked={addFileAfterCreate} disabled={busy}
     onChange={event=>setAddFileAfterCreate(event.target.checked)}/>
    <span><strong>Upload files after creating this Resource</strong>
     <span className="mt-1 block text-xs text-muted-foreground">Create the Resource first, then add scanned private files in the materials editor below. Files stay unavailable to learners until verified.</span>
    </span>
   </label>:null}
   {kind==="RESOURCE"&&editing?<label className="flex items-center gap-2 text-sm md:col-span-2">
    <Checkbox checked={removeLink} onChange={e=>setRemoveLink(e.target.checked)}/>
    Remove existing resource link
   </label>:null}
   <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 md:col-span-2 md:flex-row md:justify-end">
    <Button type="button" variant="primary" loading={busy} disabled={busy} onClick={()=>void save()}>
     {busy?"Saving…":editing?"Save Changes":kind==="RESOURCE"?"Add Resource":"Add Content"}</Button>
    <Button type="button" variant="secondary" disabled={busy} onClick={closeEditor}>Cancel</Button>
   </div>
  </div>
 );
 return <section className="min-w-0 space-y-3 md:flex-none">
  <div className="flex flex-wrap items-center gap-3">
   <h2 className={kind==="LIVE_CLASS"||kind==="RESOURCE"?"sr-only":"font-semibold"}>{kind==="YOUTUBE"?"Videos":kind==="RESOURCE"?"Resources":"Live Classes"}</h2>
   <Button type="button" variant="secondary" size="sm" disabled={!lessons.length}
    onClick={fresh} className="w-full md:w-auto">{text}</Button>
  </div>
  {!lessons.length&&<div role="status" className="space-y-2 text-sm leading-[22px]">
    <p>Create a course offering, learning path and lesson before adding content.</p>
    <p>Start from Course, then choose an active Offering and add a Lesson. The content editor becomes available as soon as a lesson exists.</p>
    <Link href="/college/courses" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Go to Courses</Link>
    <button type="button" onClick={()=>router.refresh()} className="ml-3 inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry course and lesson options</button>
  </div>}
  {open&&(kind!=="YOUTUBE"||videoMode==="YOUTUBE") ? kind==="RESOURCE"?
    <Dialog open={open} onOpenChange={value=>{if(!value)closeEditor();}}
      title={editing?"Edit Content: "+title:"Add Resource"}
      description="Select a Course and Lesson to manage the resource."
      className="max-w-[700px]" dismissible={!busy}>
      {editorFields}
    </Dialog>:
    <section aria-label="Add Content" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4">
      <h3 className="mb-3 font-semibold">{editing?"Edit Content: "+title:"Add Content"}</h3>
      {editorFields}
    </section>:null}
  <ConfirmDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}
    title={editing?"Save changes?":"Create this content?"} confirmVariant="primary"
    confirmLabel={editing?"Save changes":"Create"}
    pending={busy} onConfirm={()=>void save(true)}/>
  <ConfirmDialog open={Boolean(pendingArchive)} onOpenChange={open=>{if(!open)setPendingArchive(null);}}
    title={kind==="RESOURCE"?"Delete this resource?":"Are you sure to delete this content?"}
    description="Students will no longer see it. The record is archived and historical files are retained."
    confirmLabel="Yes" cancelLabel="No" pending={busy}
    onConfirm={()=>{if(pendingArchive)void transition(pendingArchive,"ARCHIVE",true);}}/>
  <ConfirmDialog open={Boolean(pendingPublish)} onOpenChange={open=>{if(!open)setPendingPublish(null);}}
    title="Publish this content?" description="Enrolled students will be able to see this content."
    confirmVariant="primary" confirmLabel="Publish" pending={busy}
    onConfirm={()=>{if(pendingPublish)void transition(pendingPublish,"PUBLISH",true);}}/>
  <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
   title={kind==="RESOURCE"?"Discard the changes to this resource?":"Discard lesson-content edits?"}
   description="Unsaved changes will be lost." confirmLabel="Discard changes"
   onConfirm={()=>{setDiscardOpen(false);setOpen(false);}}/>
  <Link href="/college/content-order" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
   Arrange Section syllabus across all content types →
  </Link>
  {kind==="YOUTUBE"&&lessons.length>0?<section aria-label="Video content type" className="min-w-0 space-y-3 border-b border-border pb-4">
   <fieldset className="flex flex-wrap items-center gap-4 border-0 p-0" aria-label="Video type">
    <legend className="mb-2 text-[13px] font-semibold text-body">Video type</legend>
    <label className="inline-flex min-h-9 items-center gap-2 text-sm">
     <input type="radio" name="college-content-video-type" value="UPLOAD"
      checked={videoMode==="UPLOAD"} onChange={()=>{setVideoMode("UPLOAD");setOpen(false);}}/>
     Video (Upload)
    </label>
    <label className="inline-flex min-h-9 items-center gap-2 text-sm">
     <input type="radio" name="college-content-video-type" value="YOUTUBE"
      checked={videoMode==="YOUTUBE"} onChange={()=>setVideoMode("YOUTUBE")}/>
     YouTube Video
    </label>
   </fieldset>
   {videoMode==="UPLOAD"?<>
    <label className="grid gap-1 text-[13px] font-semibold text-body">Course and Lesson
     <Select aria-label="Lesson to upload video" value={lessonId}
      onChange={event=>{setLessonId(event.target.value);setDeliveryId("");}}>
      {lessons.map(lesson=><option value={lesson.id} key={lesson.id}>
       {lesson.courseCode} · {lesson.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-[13px] font-semibold text-body">Audience
     <Select value={deliveryId} aria-label="Video audience" onChange={event=>setDeliveryId(event.target.value)}>
      <option value="">All currently eligible Sections for this Course</option>
      {allowedDeliveries.map(section=><option key={section.deliveryId} value={section.deliveryId}>
       {section.sectionName} · {section.sectionCode}</option>)}
     </Select>
    </label>
    <p className="text-xs text-muted-foreground">Upload MP4, WebM, MOV or AVI with a short-lived signed grant. Video upload progress and processing status appear below. The file is unavailable to learners until verification finishes; failed replacements keep the previous file.</p>
    <FacultyLessonVideoManager key={lessonId+":"+(deliveryId||"shared")} lessonId={lessonId}
     deliveryId={deliveryId||null} nextContentSequence={nextOverride[lessonId]??selectedLesson?.nextSequence??0}/>
   </>:<p className="text-xs text-muted-foreground">Use the YouTube video form to create a link. Uploaded video files remain private until verified.</p>}
  </section>:null}
  {kind==="RESOURCE"&&materialsEnabled&&newResourceId?<section className="min-w-0 space-y-3 border-t border-border pt-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <p className="text-sm font-semibold">Add materials to your new Resource</p>
    <Button type="button" variant="secondary" size="sm" onClick={()=>setNewResourceId(null)}>Done adding materials</Button>
   </div>
   {resourceUploadStatus?<p role="status" className="text-xs text-muted-foreground">{resourceUploadStatus}</p>:null}
   {resourceUploadStatus&&error?<p role="alert" className="text-xs text-error">{error}</p>:null}
   <LessonResourceMaterialsControl contentId={newResourceId} deliveryId={deliveryId||null} editable/>
  </section>:null}
  {(listRows.length>0||listPage>1||listMore||Boolean(existingFilters?.search))&&<details className="group min-w-0 border-b border-border pb-4"><summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text md:min-h-9">Existing Content</summary><div className="min-w-0 space-y-3 pt-3">
   {kind==="RESOURCE"&&!materialsEnabled?<p className="text-xs text-muted-foreground leading-5">
    Additional link and file materials are unavailable until the Resource Materials database runtime is verified.
    You can still edit Resource notes and its saved HTTPS link.
   </p>:null}
   {listMore?<p role="status" className="text-xs text-muted-foreground leading-5">
    Showing page {listPage} of saved items. More content is available through the next page.
   </p>:null}
   <label className="flex min-h-11 items-center gap-2 text-sm">
    <input type="checkbox" checked={allKindsForReorder} onChange={event=>{
     const enabled=event.target.checked;setAllKindsForReorder(enabled);
     applyExistingFilters({existingOrderAll:enabled?"true":""});
    }}/>
    Include all types when reordering this Lesson (other types cannot be edited here)
   </label>
   <button type="button" disabled={existingBusy} onClick={()=>
     loadExisting(new URLSearchParams(window.location.search))}
     className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
     {existingBusy?"Refreshing…":"Retry / Refresh content list"}
   </button>
   {existingError?<p role="alert" className="text-sm text-error">{existingError}</p>:null}
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Search Existing Content
    <Input type="search" maxLength={100} value={listQuery} onChange={event=>setListQuery(event.target.value)}
     onBlur={()=>applyExistingFilters({existingSearch:listQuery.trim()})}
     onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();applyExistingFilters({existingSearch:listQuery.trim()});}}}
     placeholder="Content title, Lesson or Course code"
     className="min-h-11 min-[768px]:min-h-9 max-w-2xl rounded border border-border bg-background p-2"/>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Course
    <Select value={listCourseId} onChange={event=>{setListCourseId(event.target.value);setListLessonId("");setListSectionId("");applyExistingFilters({existingCourse:event.target.value,existingLesson:"",existingSection:""});}}
      className="min-h-11 min-[768px]:min-h-9 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">All courses</option>
     {[...new Map(lessons.map(lesson=>[lesson.offeringId,
       {id:lesson.offeringId,name:lesson.courseCode+" · "+lesson.course}])).values()]
       .map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Lesson
    <Select value={listLessonId} onChange={event=>{setListLessonId(event.target.value);setListSectionId("");applyExistingFilters({existingLesson:event.target.value,existingSection:""});}}
     className="min-h-11 min-[768px]:min-h-9 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">All Lessons</option>
     {lessons.filter(row=>!listCourseId||row.offeringId===listCourseId).map(row=>
       <option key={row.id} value={row.id}>{row.courseCode} · {row.name}</option>)}
    </Select>
   </label>
   <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Section
    <Select value={listSections.some(row=>row.deliveryId===listSectionId)?listSectionId:""}
     onChange={e=>{setListSectionId(e.target.value);applyExistingFilters({existingSection:e.target.value});}}
     className="min-h-11 min-[768px]:min-h-9 max-w-2xl rounded border border-border bg-background p-2">
     <option value="">Showing every section&apos;s content together</option>
     {listSections.map(row=><option key={row.deliveryId} value={row.deliveryId}>
      {row.sectionName} ({row.sectionCode})</option>)}
    </Select>
   </label>
   {listSectionId?<p className="text-xs text-muted-foreground leading-5">
    Showing shared offering items and content specific to the selected Section.
    The Order field below is the authored default order, not a Section-specific override.
   </p>:null}
   <p className="text-xs text-muted-foreground leading-5">{matching.length} matching content items on page {listPage}{listMore?" · more available":""}.</p>
   <div className="flex flex-wrap items-center gap-2" aria-label="Existing content pagination">
    <Button type="button" variant="secondary" size="sm" disabled={existingBusy||listPage<=1}
     onClick={()=>applyExistingFilters({existingPage:String(listPage-1)})}>Previous page</Button>
    <span className="text-xs text-muted-foreground">Page {listPage}</span>
    <Button type="button" variant="secondary" size="sm" disabled={existingBusy||!listMore}
     onClick={()=>applyExistingFilters({existingPage:String(listPage+1)})}>Next page</Button>
   </div>
   {matching.length===0?<p className="text-xs text-muted-foreground leading-5">No saved items match this Lesson and Section.</p>:null}
   <p id="content-order-help" className="sr-only">Use the arrow keys to adjust a numeric Order input, then select Save order to apply it.</p>
   <DataTable mobileMode="scroll" caption="Existing Content"
     empty={<p className="text-sm">No content matches the selected Course and Lesson.</p>}
     getRowKey={item=>item.id} rows={matching}
     columns={[
      {key:"title",header:"Title",mobilePriority:"primary",cell:item=>item.title},
      {key:"type",header:"Type",cell:item=>item.contentType==="YOUTUBE"?"YouTube":item.contentType==="RESOURCE"?"Resource":item.contentType==="VIDEO"?"Video":item.contentType==="LIVE_CLASS"?"Live class":item.contentType},
      {key:"order",header:"Order",cell:item=>
       <div className="flex items-center gap-2">
        <span className="text-sm tabular-nums">{item.sequence+1}</span>
        <Link className="text-xs font-semibold text-primary-text underline"
         href={"/college/content-order"+(listSectionId?
          "?offeringId="+encodeURIComponent(item.offeringId)+"&deliveryId="+encodeURIComponent(listSectionId):"")}>
         Arrange Section
        </Link>
       </div>},
      {key:"students",header:"Students",cell:item=>item.visibleToStudents?"Visible":"Hidden"},
      {key:"content",header:"Content",cell:item=>item.externalUrl?
       <a className="text-link underline" href={item.externalUrl} target="_blank" rel="noopener noreferrer">
        {kind==="YOUTUBE"?"View":kind==="RESOURCE"?"Open link":"Join"}
       </a>:"—"},
      {key:"actions",header:"Action",mobilePriority:"action",cell:item=>
       <div className="flex flex-wrap gap-2">
        {kind==="RESOURCE"&&materialsEnabled&&item.contentType===kind?<Button size="sm" type="button" variant="ghost"
         onClick={()=>setOpenMaterialsId(openMaterialsId===item.id?null:item.id)}>Materials</Button>:null}
        <Button size="sm" type="button" variant="ghost" disabled={busy||item.contentType!==kind} onClick={()=>select(item)}>Edit</Button>
        {item.status==="DRAFT"?<Button size="sm" type="button" variant="primary"
         disabled={busy||item.contentType!==kind} onClick={()=>void transition(item,"PUBLISH")}>Publish</Button>:null}
        <Button size="sm" type="button" variant="danger" disabled={busy||item.contentType!==kind}
         onClick={()=>void transition(item,"ARCHIVE")}>Delete</Button>
       </div>},
     ]}/>
   {kind==="RESOURCE"&&materialsEnabled&&openMaterialsId? <LessonResourceMaterialsControl
      contentId={openMaterialsId} deliveryId={listRows.find(item=>item.id===openMaterialsId)?.deliveryId??null} editable/>:null}
  </div></details>}
  {error&&<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>}
  {message&&<p role="status" className="text-sm leading-[22px]">{message}</p>}
 </section>;
}
