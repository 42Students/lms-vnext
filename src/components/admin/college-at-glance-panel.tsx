"use client";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import collegeStyles from "@/components/admin/legacy-college-stat.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {useCallback,useEffect,useState} from "react";
import {COLLEGE_GLANCE_LOAD_ERROR,COLLEGE_GLANCE_REFRESH_ERROR,displayedGlanceNumber,
 isCollegeAtGlanceCounts,type CollegeAtGlanceCounts} from "@/modules/colleges/admin-college-at-glance-model";
const ITEMS=[
 {key:"students" as const,label:"Students",href:"/admin/people"},
 {key:"faculty" as const,label:"Faculty",href:"/admin/people"},
 {key:"courses" as const,label:"Courses",href:"/admin/courses"},
 {key:"activeDrives" as const,label:"Active drives",href:"/admin/placements"},
];
export function CollegeAtGlancePanel({collegeId,initial}:{collegeId:string;initial:CollegeAtGlanceCounts|null}){
 const [counts,setCounts]=useState<CollegeAtGlanceCounts|null>(initial);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState(initial? "":COLLEGE_GLANCE_LOAD_ERROR);
 const refresh=useCallback(async()=>{
  setRefreshing(true);
  try{
   const response=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/at-glance",{cache:"no-store"});
   if(!response.ok)throw Error("Failed");
   const raw=await response.json() as unknown;
   if(!isCollegeAtGlanceCounts(raw))throw Error("Invalid");
   setCounts(raw);setError("");
  }catch{
   setError(previous=>counts?COLLEGE_GLANCE_REFRESH_ERROR:previous||COLLEGE_GLANCE_LOAD_ERROR);
  }finally{setRefreshing(false);}
 },[collegeId,counts]);
 useEffect(()=>{
  const id=setInterval(()=>{void refresh();},30000);
  return ()=>clearInterval(id);
 },[refresh]);
 return <section aria-label="At a glance" className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="font-semibold text-foreground">At a glance</h2>
   {error?<Button type="button" variant="secondary" disabled={refreshing} onClick={()=>void refresh()}
     className="min-h-11 md:min-h-9 print:hidden">
     {refreshing?"Refreshing…":"Retry"}</Button>:null}
  </div>
  {error?<Alert tone={counts?"warning":"error"}>{error}</Alert>:null}
  {!counts&&refreshing?<div className="grid gap-3 min-[768px]:grid-cols-2 xl:grid-cols-4">
   {ITEMS.map(item=><Skeleton key={item.key} variant="kpi" label={item.label+" loading"}/>)}
  </div>:null}
  <div className="grid gap-3 min-[768px]:grid-cols-2 xl:grid-cols-4">
   {ITEMS.map(item=><StatTile className={collegeStyles.tile} key={item.key} href={item.href} label={item.label}
    value={displayedGlanceNumber(counts?.[item.key]??null)}
    detail="Recorded in the selected college"/>)}
  </div>
  {error&&counts?<p role="status" className="text-xs text-muted-foreground">Showing the last successful college summary.</p>:null}
 </section>;
}
