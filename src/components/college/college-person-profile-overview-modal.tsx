"use client";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Alert} from "@/components/ui/alert";
import {EmptyState} from "@/components/ui/empty-state";
import {Skeleton} from "@/components/ui/skeleton";
import {useState} from "react";
type Overview={person:{name:string;kind:"FACULTY"|"LEARNER";gender:string;bio:string;
 academicTitle:string|null;employmentType:string|null;rollNumber:string|null};
 education:{title:string;detail:string;year:string;extra:string}[];
 skills:string[];certifications:string[];projects:string[];publications:string[];
 awards:string[];experience:string[];identity:string};
const sections=["skills","certifications","projects","publications","awards","experience"] as const;
export function CollegePersonProfileOverviewModal({membershipId,name,kind}:{
 membershipId:string;name:string;kind:"FACULTY"|"LEARNER";
}){
 const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),
 [error,setError]=useState(""),[data,setData]=useState<Overview|null>(null);
 async function show(){
  setOpen(true);setError("");setLoading(true);setData(null);
  try{
   const response=await fetch("/api/college/people/"+encodeURIComponent(membershipId)+
    "/profile-overview?kind="+kind,{cache:"no-store"});
   const payload=await response.json().catch(()=>null);
   if(!response.ok||!payload?.person)throw Error(payload?.error??"Profile unavailable");
   setData(payload as Overview);
  }catch(e){setError(e instanceof Error?e.message:"Could not load profile");}
  finally{setLoading(false);}
 }
 return <>
  <Button variant="secondary" type="button" onClick={()=>void show()}
   className="min-h-11 md:min-h-9">Profile</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Profile for "+name}>
    <div className="flex justify-end">
     <Button variant="secondary" type="button" onClick={()=>setOpen(false)}
      className="min-h-11 md:min-h-9">Close</Button>
    </div>
    {loading?<Skeleton variant="row" count={3} label="Loading profile"/>:null}
    {error?<Alert tone="error">{error}</Alert>:null}
    {data?<div className="space-y-4">
     <dl className="grid min-w-0 gap-3 text-sm md:grid-cols-2">
      <div><dt className="text-muted-foreground">Gender</dt><dd>{data.person.gender||"Not recorded"}</dd></div>
      <div><dt className="text-muted-foreground">Role</dt><dd>{data.person.academicTitle||data.person.employmentType||data.person.kind}</dd></div>
      <div className="md:col-span-2"><dt className="text-muted-foreground">Bio</dt><dd>{data.person.bio||"Not recorded"}</dd></div>
     </dl>
     <section><h3 className="font-semibold">Education</h3>
      {!data.education.length?<EmptyState title="No education records" description="No education records."/>:
      <ul className="mt-2 space-y-2">{data.education.map((item,index)=>
       <li key={index} className="border-b border-border py-3 text-sm"><strong>{item.title||"Education"}</strong>
        <p>{item.detail||"Institution not recorded"} · {item.year||"Year not recorded"}</p>
        {item.extra?<p className="text-muted-foreground">{item.extra}</p>:null}
       </li>)}</ul>}
     </section>
     <div className="grid min-w-0 gap-4 md:grid-cols-2">{sections.map(section=>
      <section key={section} className="min-w-0 border-b border-border py-3">
       <h3 className="font-semibold capitalize">{section}</h3>
       {data[section].length?<ul className="mt-2 list-inside list-disc text-sm">
        {data[section].map((item,index)=><li key={index}>{item}</li>)}</ul>:
        <p className="mt-2 text-sm text-muted-foreground">None recorded.</p>}
      </section>)}</div>
     <section><h3 className="font-semibold">Identity</h3><p className="text-sm text-muted-foreground">{data.identity}</p></section>
    </div>:null}
  </Dialog>
 </>;
}
