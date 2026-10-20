"use client";
import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {DataTable} from "@/components/ui/data-table";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
type Student={learnerEnrollmentId:string;memberId:string;name:string|null;email:string|null;roll:string|null;classId:string|null};
type ClassRow={id:string;name:string;code:string;capacity:number|null;status:string;learnerCount:number;academicPeriodId:string};
export function SuperAdminBatchRosterManager({students,classes}:{students:readonly Student[];classes:readonly ClassRow[]}){
 const router=useRouter(),[search,setSearch]=useState(""),[source,setSource]=useState("ALL");
 const [moving,setMoving]=useState<string|null>(null),[destinations,setDestinations]=useState<Record<string,string>>({});
 const [pendingRow,setPendingRow]=useState<Student|null>(null);
 // A synchronous lock guards against duplicate confirmation clicks before React rerenders.
 const pendingRef=useRef(false);
 const [error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null);
 const options=classes.filter(c=>c.status==="ACTIVE");
 const found=useMemo(()=>students.filter(student=>(source==="ALL"||student.classId===source||(source==="UNASSIGNED"&&!student.classId))&&
  [student.name,student.roll,student.email].some(val=>(val??"").toLowerCase().includes(search.toLowerCase().trim()))),[students,search,source]);
 const labels=new Map(classes.map(c=>[c.id,c.name]));
 const pendingTarget=pendingRow?classes.find(c=>c.id===destinations[pendingRow.learnerEnrollmentId]):undefined;
 const pendingValid=Boolean(pendingRow&&pendingTarget&&pendingTarget.status==="ACTIVE"&&pendingTarget.id!==pendingRow.classId&&
  (pendingTarget.capacity===null||pendingTarget.learnerCount<pendingTarget.capacity)&&
  (!pendingRow.classId||classes.find(c=>c.id===pendingRow.classId)?.academicPeriodId===pendingTarget.academicPeriodId));
 async function assign(row:Student) {
  if(pendingRef.current)return;
  const id=destinations[row.learnerEnrollmentId];
  if(!id||id===row.classId)return;
  const target=classes.find(c=>c.id===id);
  const current=classes.find(c=>c.id===row.classId);
  if(current&&target&&current.academicPeriodId!==target.academicPeriodId){setError("Use Batch Promotion to move a learner to another academic period.");return;}
  if(!target||target.status!=="ACTIVE"){setError("Choose an active destination class.");return;}
  if(target.capacity!==null&&target.learnerCount>=target.capacity){setError("Destination class is full.");return;}
  pendingRef.current=true;
  setMoving(row.learnerEnrollmentId);setError(null);setNotice(null);
  try{
   const response=await fetch("/api/academics/section-enrollments",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({learnerEnrollmentId:row.learnerEnrollmentId,sectionId:id}),
   });
   const json=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(json?.error==="SECTION_CAPACITY_REACHED"?"Destination class is full.":"Unable to move student. Check your access and retry.");
   setPendingRow(null);setNotice("Class assignment saved. The active cohort roster will refresh.");router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Class move failed.");}
  finally{pendingRef.current=false;setMoving(null);}
 }
 return <section aria-label="Batch student roster" aria-busy={Boolean(moving)} className="min-w-0 space-y-4 border-b border-border pb-4">
  <div className="grid min-w-0 items-end gap-[var(--lms-space-3)] md:grid-cols-2 print:hidden">
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search name, roll no. or email
    <Input type="search" maxLength={120} value={search} onChange={e=>setSearch(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
    <Select value={source} onChange={e=>setSource(e.target.value)}
     className="min-h-11 w-full md:min-h-9">
      <option value="ALL">All classes</option><option value="UNASSIGNED">Not in a class</option>
      {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </Select>
   </label>
  </div>
  <p role="status" aria-live="polite" className="m-0 break-words text-xs leading-5 text-muted-foreground">{found.length} of {students.length} active batch learner assignments</p>
  {error?<Alert tone="error">{error}</Alert>:null}
  {notice?<Alert tone="success">{notice}</Alert>:null}
  <DataTable caption="Active batch learner assignments" rows={found}
   getRowKey={row=>row.learnerEnrollmentId+":"+row.classId}
   empty={<EmptyState title="No matching students." description="Try clearing the roster search or class filter."
    action={<Button variant="secondary" onClick={()=>{setSearch("");setSource("ALL");}}>Clear filters</Button>}/>}
   columns={[
    {key:"student",header:"Student",mobileLabel:"Student",mobilePriority:"primary",cell:row=><span className="break-words">{row.name??"Unnamed"}</span>},
    {key:"roll",header:"Roll no.",mobileLabel:"Roll no.",mobilePriority:"secondary",cell:row=><span className="break-all">{row.roll??"—"}</span>},
    {key:"email",header:"Email",mobileLabel:"Email",mobilePriority:"secondary",cell:row=><span className="break-all">{row.email??"—"}</span>},
    {key:"class",header:"Current class",mobileLabel:"Current class",mobilePriority:"secondary",
     cell:row=><span className="break-words">{row.classId?labels.get(row.classId)??"Unknown":"Not assigned"}</span>},
    {key:"move",header:"Move to",mobileLabel:"Move to",mobilePriority:"action",cell:row=>
     <div className="grid min-w-0 grid-cols-1 items-center gap-[var(--lms-space-2)] print:hidden min-[768px]:grid-cols-[minmax(0,1fr)_auto]">
      <Select aria-label={"Destination class for "+(row.name??"student")} value={destinations[row.learnerEnrollmentId]??""}
       onChange={event=>{setDestinations(current=>({...current,[row.learnerEnrollmentId]:event.target.value}));setError(null);}}
       disabled={Boolean(moving)||pendingRow!==null} className="min-h-11 w-full min-w-0 md:min-h-9">
       <option value="">Select class</option>
       {options.filter(choice=>!row.classId||choice.academicPeriodId===classes.find(item=>item.id===row.classId)?.academicPeriodId)
        .map(choice=><option key={choice.id} value={choice.id}
         disabled={choice.id!==row.classId&&choice.capacity!==null&&choice.learnerCount>=choice.capacity}>
         {choice.name}{choice.capacity!==null&&choice.learnerCount>=choice.capacity?" · Full":""}
        </option>)}
      </Select>
      <Button type="button" variant="secondary" className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto"
       disabled={Boolean(moving)||pendingRow!==null||!destinations[row.learnerEnrollmentId]||destinations[row.learnerEnrollmentId]===row.classId}
       onClick={()=>{setError(null);setPendingRow(row);}}>{moving===row.learnerEnrollmentId?"Moving…":"Move"}</Button>
     </div>},
   ]}/>
  <ConfirmDialog open={pendingRow!==null} onOpenChange={open=>{if(!open&&!moving)setPendingRow(null);}}
   title={"Move "+(pendingRow?.name??"this student")+" to "+
    (pendingTarget?.name??"selected class")+"?"}
   description="The active cohort roster and assignment will be updated; this action is audited."
   confirmLabel="Move" confirmVariant="primary" pending={Boolean(moving)}
   confirmDisabled={!pendingValid} onConfirm={()=>{if(pendingRow)void assign(pendingRow);}}>
   <dl className="grid min-w-0 gap-3 text-sm md:grid-cols-2">
    <div className="min-w-0"><dt className="text-xs font-semibold text-muted-foreground">Current class</dt>
     <dd className="mt-1 break-words text-body">{pendingRow?.classId?labels.get(pendingRow.classId)??"Unknown":"Not assigned"}</dd></div>
    <div className="min-w-0"><dt className="text-xs font-semibold text-muted-foreground">Move to</dt>
     <dd className="mt-1 break-words font-semibold text-foreground">{pendingTarget?.name??"Select class"}</dd></div>
   </dl>
  </ConfirmDialog>

  <p className="m-0 break-words text-xs leading-5 text-muted-foreground">Moves use the existing server transaction, capacity check, current-period restrictions and college permission scope. A saved move ends the previous active assignment.</p>
 </section>;
}
