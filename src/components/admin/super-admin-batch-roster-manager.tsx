"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
type Student={learnerEnrollmentId:string;memberId:string;name:string|null;email:string|null;roll:string|null;classId:string|null};
type ClassRow={id:string;name:string;code:string;capacity:number|null;status:string;learnerCount:number;academicPeriodId:string};
export function SuperAdminBatchRosterManager({students,classes}:{students:readonly Student[];classes:readonly ClassRow[]}){
 const router=useRouter(),[search,setSearch]=useState(""),[source,setSource]=useState("ALL");
 const [moving,setMoving]=useState<string|null>(null),[destinations,setDestinations]=useState<Record<string,string>>({});
 const [error,setError]=useState<string|null>(null),[notice,setNotice]=useState<string|null>(null);
 const options=classes.filter(c=>c.status==="ACTIVE");
 const found=useMemo(()=>students.filter(student=>(source==="ALL"||student.classId===source||(source==="UNASSIGNED"&&!student.classId))&&
  [student.name,student.roll,student.email].some(val=>(val??"").toLowerCase().includes(search.toLowerCase().trim()))),[students,search,source]);
 const labels=new Map(classes.map(c=>[c.id,c.name]));
 async function assign(row:Student) {
  const id=destinations[row.learnerEnrollmentId];
  if(!id||id===row.classId)return;
  const target=classes.find(c=>c.id===id);
  const current=classes.find(c=>c.id===row.classId);
  if(current&&target&&current.academicPeriodId!==target.academicPeriodId){setError("Use Batch Promotion to move a learner to another academic period.");return;}
  if(!target||target.status!=="ACTIVE"){setError("Choose an active destination class.");return;}
  if(target.capacity!==null&&target.learnerCount>=target.capacity){setError("Destination class is full.");return;}
  if(!confirm("Move "+(row.name??"this student")+" to "+target.name+"?"))return;
  setMoving(row.learnerEnrollmentId);setError(null);setNotice(null);
  try{
   const response=await fetch("/api/academics/section-enrollments",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({learnerEnrollmentId:row.learnerEnrollmentId,sectionId:id}),
   });
   const json=await response.json().catch(()=>null);
   if(!response.ok)throw new Error(json?.error==="SECTION_CAPACITY_REACHED"?"Destination class is full.":json?.error??"Unable to move student.");
   setNotice("Class assignment saved. The active cohort roster will refresh.");router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Class move failed.");}
  finally{setMoving(null);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-4" aria-label="Batch student roster">
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="grid gap-1 text-sm font-semibold text-body">Search name, roll no. or email
    <input type="search" maxLength={120} value={search} onChange={e=>setSearch(e.target.value)}
     className="min-h-11 rounded border border-border bg-background px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Class
    <select value={source} onChange={e=>setSource(e.target.value)}
     className="min-h-11 rounded border border-border bg-background px-3 text-foreground">
      <option value="ALL">All classes</option><option value="UNASSIGNED">Not in a class</option>
      {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
   </label>
  </div>
  <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{found.length} of {students.length} active batch learner assignments</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  <div className="overflow-x-auto">
   <table className="min-w-[49rem] w-full text-left text-sm"><thead><tr className="border-b border-border">
    <th className="p-2">Student</th><th className="p-2">Roll no.</th><th className="p-2">Email</th><th className="p-2">Current class</th><th className="p-2">Move to</th></tr></thead>
    <tbody>{found.map(row=><tr key={row.learnerEnrollmentId+":"+row.classId} className="border-t border-border">
     <td className="p-2">{row.name??"Unnamed"}</td><td className="p-2">{row.roll??"—"}</td>
     <td className="p-2">{row.email??"—"}</td><td className="p-2">{row.classId?labels.get(row.classId)??"Unknown":"Not assigned"}</td>
     <td className="p-2"><div className="flex items-center gap-2">
      <select aria-label={"Destination class for "+(row.name??"student")} value={destinations[row.learnerEnrollmentId]??""}
       onChange={e=>setDestinations(curr=>({...curr,[row.learnerEnrollmentId]:e.target.value}))}
       disabled={Boolean(moving)} className="min-h-10 min-w-40 rounded border border-border bg-background px-2">
       <option value="">Select class</option>{options.filter(c=>!row.classId||c.academicPeriodId===classes.find(x=>x.id===row.classId)?.academicPeriodId).map(c=><option key={c.id} value={c.id} disabled={c.id!==row.classId&&c.capacity!==null&&c.learnerCount>=c.capacity}>
        {c.name}{c.capacity!==null&&c.learnerCount>=c.capacity?" · Full":""}
       </option>)}
      </select>
      <button type="button" disabled={Boolean(moving)||!destinations[row.learnerEnrollmentId]||destinations[row.learnerEnrollmentId]===row.classId}
       onClick={()=>void assign(row)} className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
       {moving===row.learnerEnrollmentId?"Moving…":"Move"}</button></div></td>
    </tr>)}</tbody></table>
   {!found.length?<p className="p-4 text-sm text-muted-foreground">No matching students.</p>:null}
  </div>
  <p className="text-xs text-muted-foreground">Moves use the existing server transaction, capacity check, current-period restrictions and college permission scope. A saved move ends the previous active assignment.</p>
 </section>;
}
