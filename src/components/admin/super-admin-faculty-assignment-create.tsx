"use client";

import {useState, type FormEvent} from "react";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
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
 const [open,setOpen]=useState(false);
 const [deliveryId,setDeliveryId]=useState("");
 const [otherDeliveryIds,setOtherDeliveryIds]=useState<string[]>([]);
 const [membershipId,setMembershipId]=useState("");
 const [role,setRole]=useState<CourseTeachingRole>("PRIMARY");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const {pending,run}=useGuardedAction({timeoutMs:20000});
 const available=deliveries.filter(item=>!item.endedAt);
 const selected=available.find(item=>item.id===deliveryId);
 const sameClass=selected?available.filter(item=>item.sectionId===selected.sectionId):[];
 const deliveryIds=[deliveryId,...otherDeliveryIds.filter(id=>id!==deliveryId)];
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if(pending||!selected||deliveryIds.length>10||
     !deliveryIds.every(id=>sameClass.some(d=>d.id===id))||
     !faculty.some(f=>f.membershipId===membershipId)) {
    setError("Choose an active class delivery and faculty member.");return;
  }
  await run(async()=>{
   setError("");setNotice("");
   try{
    await apiFetch("/api/admin/faculty-assignment/batch",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({deliveryIds,membershipId,role}),
    });
    setOpen(false);setDeliveryId("");setOtherDeliveryIds([]);setMembershipId("");setRole("PRIMARY");
    setNotice(deliveryIds.length===1?"Teaching assignment created.":
      "Created "+deliveryIds.length+" teaching assignments for this class.");
    router.refresh();
   }catch(caught){
    setError(caught instanceof FriendlyFetchError?caught.message:
      "Could not assign this faculty member. Check the teaching role and active class.");
   }
  });
 }
 const inputClass="w-full";
 return <section aria-label="Create teaching assignment" className="space-y-3">
   <Button variant="secondary" type="button" disabled={!available.length||!faculty.length||pending}
    onClick={()=>setOpen(value=>!value)} aria-expanded={open}
    className="min-h-11 sm:min-h-9">
    Create teaching assignment
   </Button>
   {!available.length?<p role="status" className="text-sm text-body">
    Create an active course offering and class delivery before assigning a teacher.
   </p>:null}
   {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
   {open?<form onSubmit={e=>void submit(e)} className="grid gap-3 border-b border-border pb-5 sm:grid-cols-2">
    <p className="sm:col-span-2 text-sm text-body">Select a course and class in the current college. Only active faculty can be assigned.</p>
    <label className="grid gap-1 text-sm font-semibold">Course / Class / Semester
     <Select required className={inputClass} value={deliveryId} onChange={e=>{setDeliveryId(e.target.value);setOtherDeliveryIds([]);}}>
      <option value="">Choose an active class</option>
      {available.map(item=><option key={item.id} value={item.id}>
       {item.courseCode} · {item.courseName} · {item.cohortName} · {item.sectionName} · {item.academicPeriodName}
      </option>)}
     </Select>
    </label>
    {selected?<fieldset className="grid gap-2 border-b border-border pb-3 sm:col-span-2">
      <legend className="px-1 text-sm font-semibold">Course(s)</legend>
      <p className="text-xs text-body">Select several courses to assign this lecturer to all of them at once. The chosen course is always included. Select up to 9 additional courses for the same class and semester.</p>
      <div role="region" aria-label="Available courses in the selected class" tabIndex={0}
        className="grid max-h-48 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-2 [mask-image:linear-gradient(to_bottom,black_90%,transparent)]">
        {sameClass.map(item=><label key={item.id} className="flex min-h-11 items-center gap-2 text-sm">
          <Checkbox checked={item.id===deliveryId||otherDeliveryIds.includes(item.id)}
            disabled={pending||item.id===deliveryId||(!otherDeliveryIds.includes(item.id)&&deliveryIds.length>=10)}
            onChange={e=>setOtherDeliveryIds(values=>e.target.checked?[...values,item.id]:values.filter(id=>id!==item.id))}/>
          {item.courseCode} · {item.courseName}
        </label>)}
      </div>
    </fieldset>:null}
    <label className="grid gap-1 text-sm font-semibold">Faculty
     <Select required className={inputClass} value={membershipId} onChange={e=>setMembershipId(e.target.value)}>
      <option value="">Choose faculty</option>
      {faculty.map(item=><option key={item.membershipId} value={item.membershipId}>
       {item.displayName}
      </option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Role
     <Select className={inputClass} value={role} onChange={e=>setRole(e.target.value as CourseTeachingRole)}>
      {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
       {facultyAssignmentRoleLabel(value)}
      </option>)}
     </Select>
    </label>
    {truncated?<p role="status" className="text-xs text-muted-foreground">
     Only the first 500 active faculty members are available here. Use the course workspace to find others.
    </p>:null}
    {error?<p role="alert" className="sm:col-span-2 text-sm text-error">{error}</p>:null}
    <div className="flex flex-wrap gap-2 sm:col-span-2">
      <Button variant="primary" type="submit" disabled={pending} className="min-h-11 sm:min-h-9">
       {pending?"Assigning…":"Assign faculty"}
      </Button>
      <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
       className="min-h-11 sm:min-h-9">Cancel</Button>
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
   <Button variant="secondary" size="sm" type="button" className="min-h-9"
     aria-expanded={open} disabled={pending}
     onClick={()=>{setRole(initialRole);setNotice("");setOpen(v=>!v);}}>
      Edit role
   </Button>
   {open?<div className="grid gap-2">
      <label className="grid gap-1 text-xs font-semibold">Teaching role
       <Select value={role} disabled={pending}
        onChange={e=>setRole(e.target.value as CourseTeachingRole)}
        >
        {COURSE_TEACHING_ROLES.map(value=><option key={value} value={value}>
          {facultyAssignmentRoleLabel(value)}</option>)}
       </Select>
      </label>
      <Button variant="primary" type="button" disabled={pending||role===initialRole}
       onClick={()=>void save()} className="min-h-11 sm:min-h-9">
       {pending?"Saving…":"Save role"}
      </Button>
    </div>:null}
   {notice?<p role="alert" className="text-xs text-body">{notice}</p>:null}
 </div>;
}
