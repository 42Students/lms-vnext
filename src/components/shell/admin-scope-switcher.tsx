"use client";

import {useEffect,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import type {AdminScope} from "@/modules/identity/context";
import type {AdminScopeChoices} from "@/modules/admin-scope/service";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {useToast} from "@/components/ui/toast";

/** Restores the old device-local tenant lock. This is only a UI safety latch:
 * the server still authorizes the exact persisted college on every request. */
const LOCK_KEY="superadmin_tenant_locked";

export function AdminScopeSwitcher({choices,scope}:{
 choices:AdminScopeChoices;scope:AdminScope|null|undefined;
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [error,setError]=useState<string|null>(null);
 const [search,setSearch]=useState("");
 const [locked,setLocked]=useState(false);
 const [lockLoaded,setLockLoaded]=useState(false);
 const [pending,startTransition]=useTransition();
 const chosenCollege=choices.colleges.find(item=>item.id===scope?.collegeId);
 const currentOrganization=scope?.organizationId??chosenCollege?.organizationId??"";
 const currentCollege=scope?.collegeId??"";
 const [filterOrganization,setFilterOrganization]=useState(currentOrganization);
 const [priorOrganization,setPriorOrganization]=useState(currentOrganization);
 if(currentOrganization!==priorOrganization){
  setPriorOrganization(currentOrganization);
  setFilterOrganization(currentOrganization);
  setSearch("");
 }
 useEffect(()=>{
  try{setLocked(window.localStorage.getItem(LOCK_KEY)==="true");}
  catch{setLocked(false);}
  setLockLoaded(true);
 },[]);
 function updateLock(next:boolean){
  try{
   window.localStorage.setItem(LOCK_KEY,next?"true":"false");
   setLocked(next);setError(null);
  }catch{setError("Tenant lock preference could not be saved on this device.");}
 }
 function denyLocked(){
  const message="Tenant lock is enabled. Unlock to change scope.";
  setError(message);showToast({tone:"warning",title:message});
 }
 const filteredColleges=choices.colleges.filter(item=>
  (filterOrganization===""||item.organizationId===filterOrganization)
  &&(search.trim()===""||(
    item.name+" "+item.code+" "+item.organizationName
   ).toLocaleLowerCase("en-IN").includes(search.trim().toLocaleLowerCase("en-IN"))));
 const visibleColleges=choices.colleges.filter(item=>
  item.id===currentCollege||filteredColleges.includes(item));

 function switchScope(value:string){
  if(pending)return;
  if(!lockLoaded||locked){denyLocked();return;}
  if(value==="college:"+currentCollege||
    (!currentCollege&&value==="organization:"+currentOrganization)||
    (value===""&&!currentCollege&&!currentOrganization))return;
  setError(null);
  startTransition(async()=>{
   try{
    let response:Response;
    if(!value){
     response=await fetch("/api/auth/admin-scope",{
      method:"DELETE",credentials:"same-origin",
     });
    }else{
     const [kind,id]=value.split(":");
     const body=kind==="organization"?{kind,organizationId:id}:
      {kind:"college",collegeId:id};
     response=await fetch("/api/auth/admin-scope",{
      method:"POST",credentials:"same-origin",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(body),
     });
    }
    if(!response.ok){
     const feedback=value.startsWith("college:")
      ?"Couldn't switch to your saved college. Pick it again from the header."
      :"Failed to apply scope. Choose another authorized organization or college.";
     setError(feedback);showToast({tone:"error",title:feedback});return;
    }
    if(!value&&choices.colleges.length>1)
     showToast({tone:"info",title:"Showing all colleges — data may be large."});
    setSearch("");router.refresh();
   }catch{
    const feedback="Failed to load colleges. Please refresh.";
    setError(feedback);showToast({tone:"error",title:feedback});
   }
  });
 }
 return <div className="grid w-full min-w-0 max-w-72 gap-2">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
   <span className="text-xs font-semibold text-muted-foreground">Tenant scope</span>
   <label className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-body">
    <Input type="checkbox" checked={locked} disabled={!lockLoaded||pending}
     onChange={event=>updateLock(event.target.checked)}
     aria-label="Tenant lock" className="size-4 shrink-0"/>
    Tenant lock {locked?"on":"off"}
   </label>
  </div>
  <label className="grid min-w-0 gap-1 text-xs font-semibold text-body">
   Organization
   <Select value={currentOrganization} disabled={pending||!lockLoaded||locked}
    aria-label="Select organization"
    onChange={event=>{
     const id=event.target.value;
     setFilterOrganization(id);setSearch("");
     switchScope(id?"organization:"+id:"");
    }} className="w-full min-w-0">
    <option value="">All Orgs</option>
    {choices.organizations.map(item=><option key={item.id} value={item.id}>
     {item.name}</option>)}
   </Select>
  </label>
  <details className="group min-w-0">
   <summary className="flex min-h-9 cursor-pointer items-center text-sm font-semibold text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] max-[767px]:min-h-11">Search colleges</summary>
   <label htmlFor="admin-college-search" className="sr-only">Search colleges</label>
   <Input id="admin-college-search" type="search" value={search}
    onChange={event=>setSearch(event.target.value)} placeholder="Search colleges"
    className="mt-2 w-full"/>
  </details>
  <label className="grid min-w-0 gap-1 text-xs font-semibold text-body">
   College
   <Select value={currentCollege} disabled={pending||!lockLoaded||locked}
    aria-label="Select college" aria-busy={pending}
    onChange={event=>switchScope(event.target.value?"college:"+event.target.value:
      filterOrganization?"organization:"+filterOrganization:"")}
    className="w-full min-w-0">
    <option value="">All Colleges</option>
    {visibleColleges.map(item=><option key={item.id} value={item.id}>
      {item.organizationName} · {item.name}</option>)}
   </Select>
  </label>
  <p className="min-w-0 break-words text-xs text-muted-foreground">
   {chosenCollege?chosenCollege.name+" · "+chosenCollege.organizationName:
    currentOrganization?choices.organizations.find(item=>item.id===currentOrganization)?.name??"Selected organization":
    "All Orgs / All Colleges"}
  </p>
  {locked?<p role="status" className="text-xs text-muted-foreground">
   Tenant lock is enabled. Unlock to change scope.
  </p>:null}
  {pending?<p role="status" className="text-xs text-muted-foreground">Switching workspace…</p>:null}
  {search.trim()&&!filteredColleges.length?<p role="status" className="text-xs text-muted-foreground">
   No matching colleges. Clear search or choose another organization.
  </p>:null}
  {error?<p role="alert" className="min-w-0 text-xs font-medium text-error">{error}</p>:null}
 </div>;
}
