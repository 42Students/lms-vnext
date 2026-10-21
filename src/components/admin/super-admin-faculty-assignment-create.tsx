"use client";

import {useState, type FormEvent} from "react";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {Button} from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {Checkbox} from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {COURSE_TEACHING_ROLES,type CourseTeachingRole} from "@/modules/courses/constants";
import {facultyAssignmentRoleLabel} from "@/modules/courses/college-courses-copy";

type Delivery={id:string;sectionId:string;courseCode:string;courseName:string;sectionName:string;
  cohortName:string;academicPeriodName:string;endedAt:Date|null};
type Faculty={membershipId:string;displayName:string};

export function SuperAdminFacultyAssignmentCreate({
  deliveries,faculty,truncated=false,
}: {deliveries:readonly Delivery[];faculty:readonly Faculty[];truncated?:boolean}) {
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [deliveryId,setDeliveryId]=useState("");
 const [batchName,setBatchName]=useState("");
 const [sectionId,setSectionId]=useState("");
 const [periodName,setPeriodName]=useState("");
 const [facultyQuery,setFacultyQuery]=useState("");
 const [courseQuery,setCourseQuery]=useState("");
 const [otherDeliveryIds,setOtherDeliveryIds]=useState<string[]>([]);
 const [membershipId,setMembershipId]=useState("");
 const [role,setRole]=useState<CourseTeachingRole>("PRIMARY");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:20000});
 const available=deliveries.filter(item=>!item.endedAt);
 const batchNames=[...new Set(available.map(item=>item.cohortName))].sort();
 const batchDeliveries=available.filter(item=>item.cohortName===batchName);
 const classOptions=[...new Map(batchDeliveries.map(item=>[item.sectionId,item.sectionName])).entries()];
 const classDeliveries=batchDeliveries.filter(item=>item.sectionId===sectionId);
 const periodOptions=[...new Set(classDeliveries.map(item=>item.academicPeriodName))].sort();
 const scopedDeliveries=classDeliveries.filter(item=>item.academicPeriodName===periodName);
 const selected=scopedDeliveries.find(item=>item.id===deliveryId);
 const sameClass=selected?scopedDeliveries:[];
 const visibleFaculty=faculty.filter(item=>item.displayName.toLowerCase().includes(facultyQuery.trim().toLowerCase()));
 const visibleCourses=sameClass.filter(item=>
   (item.courseCode+" "+item.courseName).toLowerCase().includes(courseQuery.trim().toLowerCase()));
 const deliveryIds=[deliveryId,...otherDeliveryIds.filter(id=>id!==deliveryId)];
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if(pending)return;
  if(!batchName){setError("Select a batch");return;}
  if(!sectionId){setError("Select a class");return;}
  if(!periodName){setError("Select a semester");return;}
  if(!selected){setError("Select one or more courses");return;}
  if(!faculty.some(f=>f.membershipId===membershipId)){setError("Select faculty");return;}
  if(deliveryIds.length>10){setError("Select up to 10 courses per assignment batch.");return;}
  if(!deliveryIds.every(id=>sameClass.some(d=>d.id===id))){
    setError("Courses must belong to the selected class and semester.");return;
  }
  await run(async()=>{
   setError("");setNotice("");
   try{
    await apiFetch("/api/admin/faculty-assignment/batch",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({deliveryIds,membershipId,role}),
    });
    setOpen(false);setDeliveryId("");setOtherDeliveryIds([]);setMembershipId("");setRole("PRIMARY");
    setBatchName("");setSectionId("");setPeriodName("");setFacultyQuery("");setCourseQuery("");
    const success=deliveryIds.length===1
      ?"Created teaching assignment for this class."
      :"Created "+deliveryIds.length+" teaching assignments for this class.";
    setNotice(success);
    showToast({tone:"success",title:success});
    router.refresh();
   }catch(caught){
    setError(caught instanceof FriendlyFetchError?caught.message:
      "Could not assign this faculty member. Check the teaching role and active class.");
   }
  });
 }
 const inputClass="min-h-11 w-full md:min-h-9";
 return <section aria-label="Create teaching assignment" className="space-y-3 print:hidden">
   <Button variant="secondary" type="button" disabled={!available.length||!faculty.length||pending}
    onClick={()=>setOpen(value=>!value)} aria-expanded={open}
    className="min-h-11 w-full justify-center sm:w-auto md:min-h-9">
    Create teaching assignment
   </Button>
   {!available.length?<p role="status" className="text-sm text-body leading-[22px]">
    Create an active course offering and class delivery before assigning a teacher.
   </p>:null}
   {notice?<Alert tone="success">{notice}</Alert>:null}
   {open?<form onSubmit={e=>void submit(e)} className="grid min-w-0 gap-3 border-b border-border pb-5 md:grid-cols-2">
    <p className="md:col-span-2 text-sm text-body leading-[22px]">Select a course and class in the current college. Only active faculty can be assigned.</p>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
     <Select required className={inputClass} value={batchName}
       onChange={e=>{setBatchName(e.target.value);setSectionId("");setPeriodName("");setDeliveryId("");setOtherDeliveryIds([]);}}>
       <option value="">Select a batch</option>
       {batchNames.map(name=><option key={name} value={name}>{name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class / Section
     <Select required disabled={!batchName} className={inputClass} value={sectionId}
       onChange={e=>{setSectionId(e.target.value);setPeriodName("");setDeliveryId("");setOtherDeliveryIds([]);}}>
       <option value="">Select a class</option>
       {classOptions.map(([id,name])=><option key={id} value={id}>{name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester
     <Select required disabled={!sectionId} className={inputClass} value={periodName}
       onChange={e=>{setPeriodName(e.target.value);setDeliveryId("");setOtherDeliveryIds([]);}}>
       <option value="">Select a semester</option>
       {periodOptions.map(name=><option key={name} value={name}>{name}</option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
     <Select required disabled={!periodName} className={inputClass} value={deliveryId}
       onChange={e=>{setDeliveryId(e.target.value);setOtherDeliveryIds([]);}}>
       <option value="">Select one or more courses</option>
       {scopedDeliveries.map(item=><option key={item.id} value={item.id}>
         {item.courseCode} · {item.courseName}
       </option>)}
     </Select>
    </label>
    {selected?<fieldset className="grid gap-2 border-b border-border pb-3 md:col-span-2">
      <legend className="px-1 text-[var(--lms-font-sm)] font-semibold text-foreground">Course(s)</legend>
      <p className="text-xs text-body leading-5">Select several courses to assign this lecturer to all of them at once. The chosen course is always included. Select up to 9 additional courses for the same class and semester.</p>
      <Input type="search" aria-label="Search courses" value={courseQuery} placeholder="Search courses"
        onChange={e=>setCourseQuery(e.target.value)} />
      <div role="region" aria-label="Available courses in the selected class" tabIndex={0}
        className="grid min-w-0 max-h-48 gap-2 overflow-y-auto overscroll-contain md:grid-cols-2 [mask-image:linear-gradient(to_bottom,black_90%,transparent)]">
        {visibleCourses.map(item=><label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox checked={item.id===deliveryId||otherDeliveryIds.includes(item.id)}
            disabled={pending||item.id===deliveryId||(!otherDeliveryIds.includes(item.id)&&deliveryIds.length>=10)}
            onChange={e=>setOtherDeliveryIds(values=>e.target.checked?[...values,item.id]:values.filter(id=>id!==item.id))}/>
          {item.courseCode} · {item.courseName}
        </label>)}
      </div>
    </fieldset>:null}
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty
     <Input type="search" value={facultyQuery} placeholder="Search faculty" aria-label="Search faculty"
       onChange={e=>setFacultyQuery(e.target.value)}/>
     <Select required className={inputClass} value={membershipId} onChange={e=>setMembershipId(e.target.value)}>
      <option value="">Select faculty</option>
      {visibleFaculty.map(item=><option key={item.membershipId} value={item.membershipId}>
       {item.displayName}
      </option>)}
     </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role
     <Select className={inputClass} value={role} onChange={e=>setRole(e.target.value as CourseTeachingRole)}>
      {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
       {facultyAssignmentRoleLabel(value)}
      </option>)}
     </Select>
    </label>
    {truncated?<p role="status" className="text-xs text-muted-foreground leading-5">
     Only the first 500 active faculty members are available here. Use the course workspace to find others.
    </p>:null}
    {error?<Alert tone="error" className="md:col-span-2">{error}</Alert>:null}
    {error==="Select a batch"||error==="Select a class"||error==="Select a semester"||
      error==="Select one or more courses"||error==="Select faculty"?
      <p className="md:col-span-2 text-xs text-error" role="alert">
        Check the {error.toLowerCase().replace("select ","")} field above.
      </p>:null}
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:col-span-2 [&>button]:min-h-11 [&>button]:w-full sm:[&>button]:w-auto md:[&>button]:min-h-9">
      <Button variant="primary" type="submit" loading={pending} disabled={pending} className="min-h-11 md:min-h-9">
       {pending?"Assigning…":"Assign faculty"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
       className="min-h-11 md:min-h-9">Cancel</Button>
    </div>
   </form>:null}
 </section>;
}


/** Edit retains the persisted assignment ID and declines to create a second
 * primary teacher. The database unique index resolves concurrent editors. */
export function SuperAdminTeachingRoleEdit({
 assignmentId,role:initialRole,revision,
}:{assignmentId:string;role:CourseTeachingRole;revision:string}){
 const router=useRouter();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [role,setRole]=useState<CourseTeachingRole>(initialRole);
 const [notice,setNotice]=useState("");
 const [discardOpen,setDiscardOpen]=useState(false);
 const {run,pending}=useGuardedAction({busyLabel:"Updating role…"});
 function requestClose(){
   if(pending)return;
   if(role!==initialRole){setDiscardOpen(true);return;}
   setOpen(false);
 }
 function finishClose(){setDiscardOpen(false);setOpen(false);setRole(initialRole);}
 async function save(){
  if(pending)return;
  await run(async()=>{
   setNotice("");
   try{
    await apiFetch("/api/courses/teaching-assignments/"+encodeURIComponent(assignmentId),{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({role,expectedUpdatedAt:revision}),
    });
    setOpen(false);
    showToast({tone:"success",title:"Updated assignment #"+assignmentId+"."});
    router.refresh();
   }catch(cause){
    setNotice(cause instanceof FriendlyFetchError&&cause.status===409
      ?"This teaching assignment changed in another tab. Refresh before editing again."
      :cause instanceof FriendlyFetchError?cause.message:
      "Could not change this teaching role. Refresh and try again.");
   }
  });
 }
 return <div className="min-w-0 space-y-2 print:hidden">
   <Button variant="secondary" size="md" type="button" className="min-h-11 md:min-h-9"
     aria-expanded={open} disabled={pending}
     onClick={()=>{setRole(initialRole);setNotice("");setDiscardOpen(false);setOpen(true);}}>
      Edit assignment
   </Button>
   <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}} title={`Edit assignment: #${assignmentId}`}
     description="Change the teaching role. Course, faculty and class changes require a new authorized assignment."
     className="max-w-[500px]" dismissible={!pending}
     footer={<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
       <Button variant="secondary" type="button" disabled={pending} onClick={requestClose}>Cancel</Button>
       <Button variant="primary" type="button" loading={pending} disabled={pending||role===initialRole}
         onClick={()=>void save()}>{pending?"Saving…":"Save Changes"}</Button>
     </div>}>
     <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Teaching role
       <Select className="min-h-11 md:min-h-9" value={role} disabled={pending}
         onChange={e=>setRole(e.target.value as CourseTeachingRole)}>
         {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
           {facultyAssignmentRoleLabel(value)}</option>)}
       </Select>
     </label>
     {notice?<Alert tone="error">{notice}</Alert>:null}
   </Dialog>
   <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
     title="Discard assignment changes?" description="Your unsaved changes will be lost."
     confirmLabel="Discard edits" onConfirm={finishClose}/>
 </div>;
}
