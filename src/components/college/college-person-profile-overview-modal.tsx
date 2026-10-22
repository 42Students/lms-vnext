"use client";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {Skeleton} from "@/components/ui/skeleton";
import {useRef,useState} from "react";
type Overview={person:{name:string;kind:"FACULTY"|"LEARNER";gender:string;bio:string;
 academicTitle:string|null;employmentType:string|null;rollNumber:string|null};
 education:{title:string;detail:string;year:string;extra:string}[];
 skills:string[];certifications:string[];projects:string[];publications:string[];
 awards:string[];experience:string[];identity:string;
 learnerSections?:{key:string;label:string;items:string[];notice:string|null}[]};
const sections=["skills","certifications","projects","publications","awards","experience"] as const;
export function CollegePersonProfileOverviewModal({membershipId,name,kind}:{
 membershipId:string;name:string;kind:"FACULTY"|"LEARNER";
}){
 const requestId=useRef(0);
 function close(){requestId.current+=1;setOpen(false);}
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),
 [error,setError]=useState(""),[data,setData]=useState<Overview|null>(null);
 async function show(){
  const request=++requestId.current;
  setOpen(true);setError("");setLoading(true);setData(null);
  try{
   const response=await fetch("/api/college/people/"+encodeURIComponent(membershipId)+
    "/profile-overview?kind="+kind,{cache:"no-store"});
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.person)throw Error(payload?.error??"Profile unavailable");
   if(request===requestId.current)setData(payload as Overview);
  }catch(e){if(request===requestId.current)setError(e instanceof Error?e.message:"Could not load profile");}
  finally{if(request===requestId.current)setLoading(false);}
 }
 return <>
  <Button variant="secondary" type="button" onClick={()=>void show()}
   className="min-h-11 w-full md:min-h-9 md:w-auto">Profile</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title={"Profile — "+name} className="!max-w-[860px]" footer={<Button variant="secondary" type="button" onClick={close}
      className="min-h-11 w-full md:min-h-9 md:w-auto">Close</Button>}>
    
    {loading?<Skeleton variant="row" count={3} label="Loading profile"/>:null}
    {error?<Alert tone="error">{error}<div className="mt-[var(--lms-space-2)]"><Button variant="secondary" type="button" onClick={()=>void show()}>Retry</Button></div></Alert>:null}
    {data&&!loading&&!error?<div className="min-w-0 space-y-[var(--lms-space-4)]">
     <dl className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] text-sm md:grid-cols-2">
      <div><dt className="text-muted-foreground">Gender</dt><dd>{data.person.gender||"Not recorded"}</dd></div>
      <div><dt className="text-muted-foreground">Role</dt><dd>{data.person.academicTitle||data.person.employmentType||data.person.kind}</dd></div>
      <div className="md:col-span-2"><dt className="text-muted-foreground">Bio</dt><dd className="mt-1 whitespace-pre-wrap break-words">{data.person.bio||"Not recorded"}</dd></div>
     </dl>
     {kind==="LEARNER" && data.learnerSections ?
      <section aria-label="Learner profile sections" className="min-w-0 space-y-[var(--lms-space-4)]">
       <p className="text-sm text-muted-foreground">Read-only profile sections. Private identity values and files are not displayed here.</p>
       <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {data.learnerSections.map(section=><section key={section.key} className="min-w-0 border-b border-border pb-[var(--lms-space-3)]">
         <h3 className="text-base font-semibold text-[var(--lms-heading)]">{section.label}</h3>
         {section.items.length?<ul className="mt-2 list-inside list-disc space-y-1 break-words text-sm">
          {section.items.map((item,index)=><li key={index} className="whitespace-pre-wrap [overflow-wrap:anywhere]">{item}</li>)}
         </ul>:<p className="mt-2 text-sm text-muted-foreground">Nothing on file yet.</p>}
         {section.notice?<p className="mt-2 text-xs leading-5 text-muted-foreground">{section.notice}</p>:null}
        </section>)}
       </div>
      </section>
      :<>
     <section className="min-w-0"><h3 className="font-semibold text-[var(--lms-heading)]">Education</h3>
      {!data.education.length?<p role="status" className="py-[var(--lms-space-3)] text-sm text-muted-foreground leading-[22px]">No education records.</p>:
      <ul className="mt-[var(--lms-space-2)] divide-y divide-border">{data.education.map((item,index)=>
       <li key={index} className="min-w-0 break-words py-[var(--lms-space-3)] text-sm"><strong>{item.title||"Education"}</strong>
        <p>{item.detail||"Institution not recorded"} · {item.year||"Year not recorded"}</p>
        {item.extra?<p className="text-muted-foreground">{item.extra}</p>:null}
       </li>)}</ul>}
     </section>
     <div className="grid min-w-0 gap-4 md:grid-cols-2">{sections.map(section=>
      <section key={section} className="min-w-0 border-b border-border py-[var(--lms-space-3)]">
       <h3 className="font-semibold capitalize">{section}</h3>
       {data[section].length?<ul className="mt-[var(--lms-space-2)] list-inside list-disc space-y-[var(--lms-space-1)] break-words text-sm">
        {data[section].map((item,index)=><li key={index}>{item}</li>)}</ul>:
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">None recorded.</p>}
      </section>)}</div>
     <section className="min-w-0"><h3 className="font-semibold">Identity</h3><p className="mt-[var(--lms-space-2)] break-words text-sm text-muted-foreground leading-[22px]">{data.identity}</p></section>
     </>}
    </div>:null}
  </Dialog>
 </>;
}
