"use client";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import collegeStyles from "@/components/admin/legacy-college-stat.module.css";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {useCallback,useEffect,useRef,useState} from "react";
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
 const currentCounts=useRef<CollegeAtGlanceCounts|null>(initial);
 const requestSequence=useRef(0);
 const currentCollegeId=useRef(collegeId);
 useEffect(()=>{
  currentCollegeId.current=collegeId;
  requestSequence.current+=1;
  currentCounts.current=initial;
  setCounts(initial);
  setError("");
 },[collegeId,initial]);
 const [refreshing,setRefreshing]=useState(false);
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  const seq=++requestSequence.current;
  setRefreshing(true);
  try{
   const response=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/at-glance",{cache:"no-store"});
   if(!response.ok)throw Error("Failed");
   const raw=await response.json() as unknown;
   if(!isCollegeAtGlanceCounts(raw))throw Error("Invalid");
   if(seq!==requestSequence.current||currentCollegeId.current!==collegeId)return;
   currentCounts.current=raw;
   setCounts(raw);setError("");
  }catch{
   if(seq===requestSequence.current&&currentCollegeId.current===collegeId)
    setError(previous=>currentCounts.current?COLLEGE_GLANCE_REFRESH_ERROR:previous||COLLEGE_GLANCE_LOAD_ERROR);
  }finally{
   if(seq===requestSequence.current&&currentCollegeId.current===collegeId)setRefreshing(false);
  }
 },[collegeId]);
 useEffect(()=>{
  if(!initial)void refresh();
  const id=setInterval(()=>{void refresh();},30000);
  return ()=>clearInterval(id);
 },[refresh,initial]);
 return <section aria-label="At a glance" className="space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h2 className="font-semibold text-foreground">At a glance</h2>
   {error?<Button type="button" variant="secondary" disabled={refreshing} onClick={()=>void refresh()}
     className="min-h-11 md:min-h-9 print:hidden">
     {refreshing?"Refreshing…":"Retry"}</Button>:null}
  </div>
  {error?<Alert tone={counts?"warning":"error"}>{error}</Alert>:null}
  {!counts&&refreshing?<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
   {ITEMS.map(item=><Skeleton key={item.key} variant="kpi" label={item.label+" loading"}/>)}
  </div>:null}
  {counts?<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
   {ITEMS.map(item=><StatTile className={collegeStyles.tile} key={item.key} href={item.href} label={item.label}
    value={displayedGlanceNumber(counts?.[item.key]??null)}
    detail="Recorded in the selected college">
     <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"
      className="mt-2 text-primary-text" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={item.key==="students"?"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0":
       item.key==="faculty"?"M7 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM1 21a6 6 0 0 1 12 0M17 5a4 4 0 0 1 0 8m-2 3a6 6 0 0 1 8 5":
       item.key==="courses"?"M4 3h15v17H6a2 2 0 0 1-2-2V3Zm0 14c0-1 1-2 2-2h13M8 7h7M8 11h7":
       "M4 7h16v14H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13a22 22 0 0 0 16 0"}/>
     </svg>
    </StatTile>)}
  </div>:null}
  {error&&counts?<p role="status" className="text-xs text-muted-foreground">Showing the last successful college summary.</p>:null}
 </section>;
}
