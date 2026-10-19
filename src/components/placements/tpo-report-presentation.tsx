"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";
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
  <Button variant="secondary" type="button" onClick={()=>void toggle()}
   aria-pressed={active} className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
   {active?"Exit presentation view":"Presentation view"}
  </Button>
  {error?<span role="alert" className="text-xs text-[var(--lms-gold-accent)]">{error}</span>:null}
  <style>{`[data-tpo-presentation-report]:fullscreen { background: var(--surface); color: var(--foreground); min-height: 100vh; overflow-y: auto; padding: 1.25rem; }`}</style>
 </div>;
}
