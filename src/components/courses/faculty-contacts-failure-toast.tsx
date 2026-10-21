"use client";
import {useEffect,useState} from "react";
import {Button} from "@/components/ui/button";

/** Legacy Contacts had a bottom-right five-second failure notification.
 * This nonblocking notice supplements the inline retry and expires on its own.
 * It never contains private contact data or a server error detail. */
export function FacultyContactsFailureToast(){
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const id=setTimeout(()=>setVisible(false),5000);
  return ()=>clearTimeout(id);
 },[]);
 if(!visible)return null;
 return <aside role="alert" aria-label="Contacts load notification"
  className="pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[1000] w-[min(420px,calc(100vw_-_32px))] rounded-[var(--lms-canvas-radius)] border border-l-4 border-error bg-surface px-4 py-3 text-foreground shadow-[var(--lms-toast-shadow)]">
  <div className="flex items-start gap-3">
   <div className="min-w-0 flex-1">
    <p className="text-sm font-semibold">Couldn't load contacts</p>
    <p className="mt-1 text-sm">Something went wrong on our end. Please try again.</p>
   </div>
   <Button type="button" variant="ghost" onClick={()=>setVisible(false)}
    aria-label="Dismiss contacts failure notification" className="min-h-11 min-w-11">×</Button>
  </div>
 </aside>;
}
