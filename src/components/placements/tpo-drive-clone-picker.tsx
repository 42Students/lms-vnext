"use client";
import {useMemo,useState} from "react";
import {Input} from "@/components/ui/input";
import {TpoDriveCloneAction} from "./tpo-drive-clone-action";
import {CollegeDriveDuplicateAction} from "./college-drive-duplicate-action";

export type CloneableTpoDrive={
  id:string;title:string;status:string;
  createdAt:string;
};

/** College-scoped historical drafts that have finished or been cancelled.
 * The selector never authorizes cloning; the server command rechecks owner,
 * status, source policy and current season before creating a new DRAFT. */
export function TpoDriveClonePicker({drives,collegeAdmin=false}:{drives:readonly CloneableTpoDrive[];collegeAdmin?:boolean}){
 const [search,setSearch]=useState("");
 const filtered=useMemo(()=>{
  const needle=search.trim().toLocaleLowerCase("en-IN");
  return needle?drives.filter(drive=>
    drive.title.toLocaleLowerCase("en-IN").includes(needle)||
    drive.status.toLocaleLowerCase("en-IN").includes(needle)):drives;
 },[drives,search]);
 return <div className="min-w-0 space-y-3">
   <p className="text-xs leading-5 text-body">
     Choose a completed or cancelled drive to run again. The new copy is a draft.
     Company, job details, role packages, eligibility and the round plan are copied.
     Round dates, external links, booked interviews, applications, outcomes and offers are not.
     Review batches and passing years before publishing.
   </p>
   <label className="block max-w-[360px] text-xs font-semibold text-body">
     <span className="mb-1 block">Find a past drive</span>
     <Input type="search" aria-label="Find a past drive" value={search}
       onChange={event=>setSearch(event.target.value)}
       maxLength={100} placeholder="Search job title or status"
       className="min-h-11 w-full md:min-h-9"/>
   </label>
   {filtered.length===0?<p role="status" className="text-sm text-muted-foreground">
     No completed drives match your search. Change the search or create a new draft below.
   </p>:<ul className="grid min-w-0 gap-3 md:grid-cols-2">
    {filtered.map(drive=><li key={drive.id}
      className="flex min-w-0 flex-col justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border bg-white p-4 sm:flex-row sm:items-center">
      <div className="min-w-0">
       <p className="break-words text-sm font-semibold text-foreground">{drive.title}</p>
       <p className="mt-1 text-xs text-muted-foreground">
        {drive.status==="CANCELLED"?"Cancelled":"Closed"} ·{" "}
        {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"})
          .format(new Date(drive.createdAt))}
       </p>
      </div>
      {collegeAdmin?<CollegeDriveDuplicateAction jobId={drive.id}/>:
       <TpoDriveCloneAction jobId={drive.id} label="Clone drive"/>}
    </li>)}
   </ul>}
   {drives.length>=60?<p className="text-xs text-muted-foreground">
     Showing the 60 most recent eligible historical drives. Older records remain
     available through the full drive directory.
   </p>:null}
 </div>;
}
