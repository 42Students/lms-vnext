"use client";

import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";

type DriveStatusFilter="ALL"|"DRAFT"|"ACTIVE"|"CLOSED";

/** The original Jobs search applies as you type. It never changes tenant scope,
 * and any filter change resets the selected page to avoid stale results. */
export function SuperAdminDriveDirectoryFilters({q:initialQ,status:initialStatus,
 pageSize:initialSize}:{q:string;status:DriveStatusFilter;pageSize:number}){
 const router=useRouter();
 const [q,setQ]=useState(initialQ);
 useEffect(()=>{setQ(initialQ);},[initialQ]);
 const navigate=useCallback((patch:{q?:string;status?:DriveStatusFilter;pageSize?:number})=>{
   const params=new URLSearchParams(window.location.search);
   const nextQuery=(patch.q??q).trim();
   const nextStatus=patch.status??initialStatus;
   const nextSize=patch.pageSize??initialSize;
   if(nextQuery)params.set("q",nextQuery);else params.delete("q");
   if(nextStatus==="ALL")params.delete("status");else params.set("status",nextStatus);
   if(nextSize===20)params.delete("pageSize");else params.set("pageSize",String(nextSize));
   params.delete("page");
   const encoded=params.toString();
   router.replace("/admin/placements/drives"+(encoded?"?"+encoded:""),{scroll:false});
 },[router,q,initialStatus,initialSize]);
 useEffect(()=>{
   if(q===initialQ)return;
   const timer=window.setTimeout(()=>navigate({q}),350);
   return ()=>window.clearTimeout(timer);
 },[q,initialQ,navigate]);
 return <form action="/admin/placements/drives" method="get"
   aria-label="Filter placement drives" onSubmit={event=>{event.preventDefault();navigate({q});}}
   className="grid min-w-0 grid-cols-1 items-end gap-2 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-[minmax(0,260px)_minmax(0,120px)_minmax(0,148px)_auto_auto]">
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
     <span className="sr-only">Search jobs</span>
     <Input type="search" maxLength={100} name="q" placeholder="Search by job title or company"
       aria-label="Search jobs" value={q} onChange={event=>setQ(event.target.value)}
       className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
     <span className="sr-only">Filter by status</span>
     <Select name="status" value={initialStatus} aria-label="Filter by status"
       className="min-h-11 w-full md:min-h-9"
       onChange={event=>navigate({q,status:event.target.value as DriveStatusFilter})}>
       <option value="ALL">All</option><option value="DRAFT">Draft</option>
       <option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
     </Select>
   </label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">
     <span className="sr-only">Jobs per page</span>
     <Select name="pageSize" value={String(initialSize)} aria-label="Jobs per page"
       className="min-h-11 w-full md:min-h-9"
       onChange={event=>navigate({q,pageSize:Number(event.target.value)})}>
       {[10,20,50,100].map(n=><option key={n} value={String(n)}>{n} / page</option>)}
     </Select>
   </label>
   <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
   <Link href="/admin/placements/drives"
     className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     Clear filters
   </Link>
 </form>;
}
