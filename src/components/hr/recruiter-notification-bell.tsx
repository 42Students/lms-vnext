"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ShellNavGlyph } from "@/components/shell/shell-nav-icons";
import { Drawer } from "@/components/ui/drawer";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useCallback,useEffect,useRef,useState} from "react";
import {recruiterBellAriaLabel,recruiterBellPreview,createRecruiterBellRequestGate,type RecruiterBellItem}
 from "@/modules/placements/recruiter-bell-model";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
type DrawerResponse={status:string;unread:number;collegeId?:string;
 rows?:Array<RecruiterBellItem>;choices?:Array<{collegeId:string;collegeName:string}>};
export function RecruiterNotificationBell(){
 const [isOpen,setIsOpen]=useState(false);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const requestGate=useRef(createRecruiterBellRequestGate());
 const [data,setData]=useState<DrawerResponse|null>(null);
 const [collegeId,setCollegeId]=useState("");
 const [error,setError]=useState("");
 const load=useCallback(async()=>{
  const request=requestGate.current.begin();
  try{
   const query=collegeId?"?collegeId="+encodeURIComponent(collegeId):"";
   const res=await fetch("/api/placements/recruiter/notifications/drawer"+query,{cache:"no-store"});
   if(!res.ok)throw new Error("FAILED");
   const payload=await res.json() as DrawerResponse;
   if(!requestGate.current.isCurrent(request))return;
   // A mismatched backend selection is not a valid response to this picker.
   if(collegeId && payload.status==="READY" && payload.collegeId!==collegeId){
    setData(null);setError("Couldn't load notifications. Try again.");return;
   }
   // The bell must never present a malformed or stale tenant feed as empty.
   if(!payload || !["READY","CHOOSE_COLLEGE","NO_ACCESS"].includes(payload.status) ||
      !Number.isInteger(payload.unread) || payload.unread<0 ||
      (payload.status==="READY"&&!Array.isArray(payload.rows)) ||
      (payload.status==="CHOOSE_COLLEGE"&&!Array.isArray(payload.choices))) {
     setData(null);setError("Couldn't verify notifications. Try again.");return;
   }
   setData(payload);setError("");
  }catch{
   if(!requestGate.current.isCurrent(request))return;
   // Grant/session changes must not leave an older private list visible.
   setData(null);setError("Couldn't load notifications. Try again.");
  }
 },[collegeId]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void load();
  const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void load();},30000);
  return ()=>{window.clearInterval(interval);requestGate.current.invalidate();};
 },[load]);

 const href="/hr/notifications"+(data?.collegeId?"?collegeId="+encodeURIComponent(data.collegeId):"");
 return <div className="relative">
  <Button ref={triggerRef} type="button" onClick={()=>{setIsOpen(!isOpen);if(!isOpen)void load();}}
    aria-expanded={isOpen} aria-haspopup="dialog"
    aria-label={recruiterBellAriaLabel(data?.unread??null)}
    variant="secondary" className="relative min-h-11 min-w-11 md:min-h-9 md:min-w-9 p-0">
    <ShellNavGlyph name="bell" />
    {data?.unread&&data.unread>0?<Badge tone="error" aria-hidden="true"
      className="pointer-events-none absolute -right-1 -top-1 min-h-4 min-w-4 rounded-full border-0 bg-[var(--lms-error)] px-1 py-0 text-xs leading-4 text-[color:var(--lms-on-primary)]">
      {data.unread>99?"99+":data.unread}</Badge>:null}
  </Button>
  <Drawer open={isOpen} onOpenChange={setIsOpen} title="Notifications"
   footer={<TextLink href={href} onClick={()=>setIsOpen(false)}
     className="inline-flex min-h-11 w-full items-center justify-center text-sm md:min-h-9 md:w-auto">See all notifications</TextLink>}>
   {!data&&!error?<Skeleton label="Loading notifications" variant="row" count={3} className="mt-3"/>:null}
   {error?<ErrorState title="Notifications unavailable" description={error} action={<Button type="button" onClick={()=>void load()} variant="secondary" className="min-h-11 md:min-h-9">Retry</Button>}/>:null}
   {data?.status==="CHOOSE_COLLEGE"?
    <div className="mt-3 space-y-2 text-sm">{data.choices?.map(item=>
     <Button type="button" key={item.collegeId} onClick={()=>{
       requestGate.current.invalidate();setData(null);setError("");setCollegeId(item.collegeId);
      }}
      variant="secondary" className="min-h-11 w-full justify-start text-left md:min-h-9">
      {item.collegeName}</Button>)}</div>:null}
   {data?.status==="NO_ACCESS"?<EmptyState title="No recruiter notification access" description="Choose an authorized recruiter workspace or ask your placement cell to review your access."/>:null}
   {data?.status==="READY"&&data.rows?.length===0?
     <EmptyState title="No notifications yet" description="New placement notifications will appear here."/>:null}
   {data?.status==="READY"&&data.rows?.length?
    <ScrollCue axis="y" label="Recruiter notifications" className="mt-3 min-w-0" viewportClassName="max-h-[50vh]"><ul className="min-w-0 divide-y divide-border">
     {recruiterBellPreview(data.rows).map(item=><li key={item.id}>
      <ButtonLink variant="secondary" href={"/hr/placements/jobs/"+encodeURIComponent(item.jobId)}
       onClick={()=>setIsOpen(false)}
       className="block min-w-0">
       {item.label} · {item.title}{item.unread?" · New":""}
      </ButtonLink></li>)}
    </ul></ScrollCue>:null}
  </Drawer>
 </div>;
}
