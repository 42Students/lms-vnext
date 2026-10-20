"use client";
import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {DataTable} from "@/components/ui/data-table";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
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
 return <section className="space-y-4 border-b border-border pb-5" aria-label="Batch student roster">
  <div className="grid gap-3 md:grid-cols-2 print:hidden">
   <label className="grid gap-1 text-[13px] font-semibold text-body">Search name, roll no. or email
    <Input type="search" maxLength={120} value={search} onChange={e=>setSearch(e.target.value)}
     className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold text-body">Class
    <Select value={source} onChange={e=>setSource(e.target.value)}
     className="min-h-11 w-full md:min-h-9">
      <option value="ALL">All classes</option><option value="UNASSIGNED">Not in a class</option>
      {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </Select>
   </label>
  </div>
  <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{found.length} of {students.length} active batch learner assignments</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  <DataTable caption="Active batch learner assignments" rows={found}
   getRowKey={row=>row.learnerEnrollmentId+":"+row.classId}
   empty={<p role="status" className="text-sm text-body">No matching students.</p>}
   columns={[
    {key:"student",header:"Student",mobileLabel:"Student",mobilePriority:"primary",cell:row=>row.name??"Unnamed"},
    {key:"roll",header:"Roll no.",mobileLabel:"Roll no.",mobilePriority:"secondary",cell:row=>row.roll??"—"},
    {key:"email",header:"Email",mobileLabel:"Email",mobilePriority:"secondary",cell:row=>row.email??"—"},
    {key:"class",header:"Current class",mobileLabel:"Current class",mobilePriority:"secondary",
     cell:row=>row.classId?labels.get(row.classId)??"Unknown":"Not assigned"},
    {key:"move",header:"Move to",mobileLabel:"Move to",mobilePriority:"action",cell:row=>
     <div className="flex min-w-0 flex-wrap items-center gap-2 print:hidden">
      <Select aria-label={"Destination class for "+(row.name??"student")} value={destinations[row.learnerEnrollmentId]??""}
       onChange={event=>setDestinations(current=>({...current,[row.learnerEnrollmentId]:event.target.value}))}
       disabled={Boolean(moving)} className="min-h-11 min-w-0 flex-1 md:min-h-9">
       <option value="">Select class</option>
       {options.filter(choice=>!row.classId||choice.academicPeriodId===classes.find(item=>item.id===row.classId)?.academicPeriodId)
        .map(choice=><option key={choice.id} value={choice.id}
         disabled={choice.id!==row.classId&&choice.capacity!==null&&choice.learnerCount>=choice.capacity}>
         {choice.name}{choice.capacity!==null&&choice.learnerCount>=choice.capacity?" · Full":""}
        </option>)}
      </Select>
      <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
       disabled={Boolean(moving)||!destinations[row.learnerEnrollmentId]||destinations[row.learnerEnrollmentId]===row.classId}
       onClick={()=>setPendingRow(row)}>{moving===row.learnerEnrollmentId?"Moving…":"Move"}</Button>
     </div>},
   ]}/>
  <ConfirmDialog open={pendingRow!==null} onOpenChange={open=>{if(!open)setPendingRow(null);}}
   title={"Move "+(pendingRow?.name??"this student")+" to "+
    (classes.find(item=>item.id===destinations[pendingRow?.learnerEnrollmentId??""])?.name??"selected class")+"?"}
   description="The active cohort roster and assignment will be updated; this action is audited."
   confirmLabel="Move" pending={Boolean(moving)}
   confirmDisabled={!pendingRow||!destinations[pendingRow.learnerEnrollmentId]}
   onConfirm={()=>{if(pendingRow)void assign(pendingRow);}}/>

  <p className="text-xs text-muted-foreground">Moves use the existing server transaction, capacity check, current-period restrictions and college permission scope. A saved move ends the previous active assignment.</p>
 </section>;
}
