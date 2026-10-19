"use client";
import { Button } from "@/components/ui/button";
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
  <Button variant="secondary" type="button" onClick={()=>void toggle()}
   aria-pressed={active}>
   {active?"Exit presentation view":"Presentation view"}
  </Button>
  {error?<span role="alert" className="text-xs text-[var(--lms-gold-accent)]">{error}</span>:null}
  <style>{`
   [data-tpo-presentation-report]:fullscreen { background: var(--surface); color: var(--foreground); min-height: 100vh; overflow-y: auto; padding: 1.25rem; }
   @media print {
     body { background: white !important; background-image: none !important; }
     [data-slot="legacy-sidebar"], [aria-label="Application top bar"], [aria-label="Reports navigation"] { display: none !important; }
     .lms-shell-page { margin: 0 !important; width: 100% !important; }
     #lms-main-content { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; }
     [data-slot="page-canvas"] { background: white !important; border: 0 !important; border-radius: 0 !important; box-shadow: none !important; padding: 0 !important; }
     [data-tpo-presentation-report] { background: white !important; color: var(--lms-heading) !important; }
     [data-tpo-presentation-report] [data-slot="page-header"] { break-after: avoid; }
     [data-tpo-presentation-report] form,
     [data-tpo-presentation-report] button,
     [data-tpo-presentation-report] select,
     [data-tpo-presentation-report] input,
     [data-tpo-presentation-report] [data-slot="pagination"] { display: none !important; }
     [data-tpo-presentation-report] table { width: 100%; border-collapse: collapse; }
     [data-tpo-presentation-report] thead { display: table-header-group; }
     [data-tpo-presentation-report] tr { break-inside: avoid; }
     [data-tpo-presentation-report] th,
     [data-tpo-presentation-report] td { border-bottom: 1px solid var(--lms-canvas-border); }
   }
  `}</style>
 </div>;
}
