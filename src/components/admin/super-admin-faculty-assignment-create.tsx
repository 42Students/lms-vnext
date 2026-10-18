"use client";

import {useState, type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {COURSE_TEACHING_ROLES,type CourseTeachingRole} from "@/modules/courses/constants";
import {facultyAssignmentRoleLabel} from "@/modules/courses/college-courses-copy";

type Delivery={id:string;courseCode:string;courseName:string;sectionName:string;
  cohortName:string;academicPeriodName:string;endedAt:Date|null};
type Faculty={membershipId:string;displayName:string};

export function SuperAdminFacultyAssignmentCreate({
  deliveries,faculty,truncated=false,
}: {deliveries:readonly Delivery[];faculty:readonly Faculty[];truncated?:boolean}) {
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [deliveryId,setDeliveryId]=useState("");
 const [membershipId,setMembershipId]=useState("");
 const [role,setRole]=useState<CourseTeachingRole>("PRIMARY");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:20000});
 const available=deliveries.filter(item=>!item.endedAt);
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if(pending||!available.some(d=>d.id===deliveryId)||
     !faculty.some(f=>f.membershipId===membershipId)) {
    setError("Choose an active class delivery and faculty member.");return;
  }
  await run(async()=>{
   setError("");setNotice("");
   try{
    await apiFetch("/api/courses/teaching-assignments",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({deliveryId,membershipId,role}),
    });
    setOpen(false);setDeliveryId("");setMembershipId("");setRole("PRIMARY");
    setNotice("Teaching assignment created.");
    router.refresh();
   }catch(caught){
    setError(caught instanceof FriendlyFetchError?caught.message:
      "Could not assign this faculty member. Check the teaching role and active class.");
   }
  });
 }
 const inputClass="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground";
 return <section aria-label="Create teaching assignment" className="space-y-3">
   <button type="button" disabled={!available.length||!faculty.length||pending}
    onClick={()=>setOpen(value=>!value)} aria-expanded={open}
    className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
    Create teaching assignment
   </button>
   {!available.length?<p role="status" className="text-sm text-body">
    Create an active course offering and class delivery before assigning a teacher.
   </p>:null}
   {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
   {open?<form onSubmit={e=>void submit(e)} className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
    <p className="sm:col-span-2 text-sm text-body">Select a course and class in the current college. Only active faculty can be assigned.</p>
    <label className="grid gap-1 text-sm font-semibold">Course / Class / Semester
     <select required className={inputClass} value={deliveryId} onChange={e=>setDeliveryId(e.target.value)}>
      <option value="">Choose an active class</option>
      {available.map(item=><option key={item.id} value={item.id}>
       {item.courseCode} · {item.courseName} · {item.cohortName} · {item.sectionName} · {item.academicPeriodName}
      </option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Faculty
     <select required className={inputClass} value={membershipId} onChange={e=>setMembershipId(e.target.value)}>
      <option value="">Choose faculty</option>
      {faculty.map(item=><option key={item.membershipId} value={item.membershipId}>
       {item.displayName}
      </option>)}
     </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Role
     <select className={inputClass} value={role} onChange={e=>setRole(e.target.value as CourseTeachingRole)}>
      {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
       {facultyAssignmentRoleLabel(value)}
      </option>)}
     </select>
    </label>
    {truncated?<p role="status" className="text-xs text-muted-foreground">
     Only the first 500 active faculty members are available here. Use the course workspace to find others.
    </p>:null}
    {error?<p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap gap-2 sm:col-span-2">
      <button type="submit" disabled={pending} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
       {pending?"Assigning…":"Assign faculty"}
      </button>
      <button type="button" disabled={pending} onClick={()=>setOpen(false)}
       className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold">Cancel</button>
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
 const [open,setOpen]=useState(false);
 const [role,setRole]=useState<CourseTeachingRole>(initialRole);
 const [notice,setNotice]=useState("");
 const {run,pending}=useGuardedAction({busyLabel:"Updating role…"});
 async function save(){
  if(pending)return;
  await run(async()=>{
   setNotice("");
   try{
    await apiFetch("/api/courses/teaching-assignments/"+encodeURIComponent(assignmentId),{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({role,expectedUpdatedAt:revision}),
    });
    setOpen(false);router.refresh();
   }catch(cause){
    setNotice(cause instanceof FriendlyFetchError&&cause.status===409
      ?"This teaching assignment changed in another tab. Refresh before editing again."
      :cause instanceof FriendlyFetchError?cause.message:
      "Could not change this teaching role. Refresh and try again.");
   }
  });
 }
 return <div className="min-w-0 space-y-2">
   <button type="button" className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold"
     aria-expanded={open} disabled={pending}
     onClick={()=>{setRole(initialRole);setNotice("");setOpen(v=>!v);}}>
      Edit role
   </button>
   {open?<div className="grid gap-2">
      <label className="grid gap-1 text-xs font-semibold">Teaching role
       <select value={role} disabled={pending}
        onChange={e=>setRole(e.target.value as CourseTeachingRole)}
        className="min-h-11 rounded border border-border bg-surface px-2">
        {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
          {facultyAssignmentRoleLabel(value)}</option>)}
       </select>
      </label>
      <button type="button" disabled={pending||role===initialRole}
       onClick={()=>void save()}
       className="min-h-11 rounded border border-border px-3 text-sm font-semibold">
       {pending?"Saving…":"Save role"}
      </button>
    </div>:null}
   {notice?<p role="alert" className="text-xs text-body">{notice}</p>:null}
 </div>;
}
