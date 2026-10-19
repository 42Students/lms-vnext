"use client";
import { FilterChip } from "@/components/ui/filter-chip";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useEffect,useState} from "react";
/** Native fullscreen isolates the report main region from shell navigation. */
export function TpoReportPresentation(){
 const [active,setActive]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  const sync=()=>setActive(Boolean(document.fullscreenElement?.matches("[data-tpo-presentation-report]")));
  document.addEventListener("fullscreenchange",sync);
  sync();
  return ()=>document.removeEventListener("fullscreenchange",sync);
 },[]);
 async function toggle(){
  setError("");
  try{
   if(document.fullscreenElement){await document.exitFullscreen();return;}
   const main=document.querySelector<HTMLElement>("[data-tpo-presentation-report]");
   if(!main||!main.requestFullscreen)throw Error("Fullscreen is not available in this browser.");
   await main.requestFullscreen();
  }catch(cause){setError(cause instanceof Error?cause.message:"Presentation mode unavailable.");}
 }
 return <div className="inline-flex flex-wrap items-center gap-2">
  <FilterChip type="button" className="min-h-11 md:min-h-8 print:hidden" onClick={()=>void toggle()}
   aria-pressed={active}>
   {active?"Exit presentation view":"Presentation view"}
  </FilterChip>
  {error?<InlineNotice tone="error" message={error}/>:null}
  <style>{`
   [data-tpo-presentation-report]:fullscreen { background: var(--surface); color: var(--foreground); min-height: 100vh; overflow-y: auto; padding: 1.25rem; }
  `}</style>
 </div>;
}
