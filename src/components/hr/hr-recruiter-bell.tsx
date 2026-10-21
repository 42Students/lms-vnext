"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ShellNavGlyph } from "@/components/shell/shell-nav-icons";
import { Drawer } from "@/components/ui/drawer";
import { PopoverPanel } from "@/components/ui/popover";
import style from "@/components/shell/topbar/topbar.module.css";
import Link from "next/link";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {createRecruiterBellRequestGate} from "@/modules/placements/recruiter-bell-model";
import {useCallback,useEffect,useRef,useState} from "react";
import {HR_BELL_EMPTY,HR_BELL_EMPTY_HELP,relativeHrBellTime,createHrBellMutationGate,parseHrBellResponse,type HrBellResponse} from "@/modules/placements/hr-recruiter-bell-model";
function isHrBellReadReceipt(value:unknown):value is {marked:number}{
 if(!value||typeof value!=="object"||!("marked" in value))return false;
 const count=(value as {marked:unknown}).marked;
 return typeof count==="number"&&Number.isSafeInteger(count)&&count>=0;
}
export function HrRecruiterBell(){
 const [state,setState]=useState<HrBellResponse|null>(null),[open,setOpen]=useState(false),
 [loading,setLoading]=useState(false),[error,setError]=useState(""),[saveError,setSaveError]=useState("");
 const [now,setNow]=useState(()=>Date.now());
 const markAllGate=useRef(createHrBellMutationGate());
 const loadGate=useRef(createRecruiterBellRequestGate());
 const triggerRef=useRef<HTMLButtonElement>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 const [mobile,setMobile]=useState(false);
 const load=useCallback(async()=>{
  const request=loadGate.current.begin();
  let authorizationLost=false;
  try{
   const res=await fetch("/api/placements/recruiter/bell",{
    cache:"no-store",credentials:"same-origin",redirect:"error",
   });
   if(!res.ok){
    authorizationLost=res.status===401||res.status===403;
    throw Error("Unable to load");
   }
   const payload:unknown=await res.json();
   const data=parseHrBellResponse(payload);
   if(!data)throw Error("INVALID_BELL_RESPONSE");
   if(!loadGate.current.isCurrent(request))return;
   setState(data);setError("");
  }catch{
   if(!loadGate.current.isCurrent(request))return;
   // Retain last-good data on a transient error; never retain private feed
   // after the API explicitly reports revoked/no authorized access.
   if(authorizationLost)setState(null);
   setError(authorizationLost
    ? "Your notification access has changed. Sign in again."
    : "Couldn't refresh your notifications");
  }finally{if(loadGate.current.isCurrent(request))setNow(Date.now());}
 },[]);
 useEffect(()=>{
  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial and 30s polling load.
  void load();
  const id=setInterval(()=>{void load();},30000);
  return ()=>{clearInterval(id);loadGate.current.invalidate();};
 },[load]);
 useEffect(()=>{
  const mq=window.matchMedia("(max-width:767px)");
  const check=()=>setMobile(mq.matches);
  check();
  mq.addEventListener("change",check);
  return ()=>mq.removeEventListener("change",check);
 },[]);
 useEffect(()=>{
  if(!open || mobile)return;
  const pointer=(event:PointerEvent)=>{
   if(rootRef.current && !rootRef.current.contains(event.target as Node))setOpen(false);
  };
  const key=(event:KeyboardEvent)=>{
   if(event.defaultPrevented||event.key!=="Escape")return;
   if(event.target instanceof Node && rootRef.current && !rootRef.current.contains(event.target))return;
   event.preventDefault();setOpen(false);triggerRef.current?.focus();
  };
  document.addEventListener("pointerdown",pointer);
  document.addEventListener("keydown",key);
  return ()=>{document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",key);};
 },[open,mobile]);
 async function markAll(){
  if(!markAllGate.current.tryBegin())return;
  setLoading(true);setSaveError("");
  try{
   const res=await fetch("/api/placements/recruiter/bell",{method:"POST",
    credentials:"same-origin",redirect:"error",
    headers:{"Content-Type":"application/json",Accept:"application/json"},body:"{}"});
   if(!res.ok)throw Error("Could not save");
   const receipt:unknown=await res.json().catch(()=>null);
   if(!isHrBellReadReceipt(receipt))throw Error("Could not confirm read status");
   await load();
  }catch{
   setSaveError("Notifications loaded, but read status could not be saved");
  }
  finally{markAllGate.current.end();setLoading(false);}
 }

 const unread=state?.unread??0;
 const panelFooter=<><div role="group" aria-label="Recruiter notification actions" className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <Link href="/hr/notifications" onClick={()=>setOpen(false)} className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text underline sm:w-auto hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">See all notifications</Link>
    {unread>0?<Button type="button" disabled={loading} loading={loading} onClick={()=>void markAll()}
      variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">{loading?"Saving…":"Mark all read"}</Button>:null}
   </div>
   {saveError?<Alert tone="warning" className="mt-2">
    {saveError} <Button type="button" variant="secondary" disabled={loading}
      onClick={()=>void markAll()}>Retry</Button>
   </Alert>:null}</>;
 const panelBody=<>
   {error ? state ? <Alert tone="warning" className="mt-2">
    Showing the last notifications we loaded. <Button type="button" variant="secondary"
      onClick={()=>void load()}>Retry</Button>
   </Alert> : <ErrorState title="Notifications unavailable" description={error}/> : null}
   {state?.status==="READY"&&state.hiddenUnread>0?
    <Alert tone="info" className="mt-2">
      {state.hiddenUnread} older unread {state.hiddenUnread===1?"notification is":"notifications are"} not shown here.
      See all notifications before marking everything as read.
    </Alert>:null}
   {!state&&!error?<Skeleton label="Loading notifications" variant="row" count={3} className="mt-3"/>:
    state?.status!=="READY"?<p className="mt-3 text-sm text-body leading-[22px]">{error?"Couldn't load your notifications":"Choose a college to view your notifications."}</p>:
    state.items.length===0?<EmptyState title={HR_BELL_EMPTY} description={HR_BELL_EMPTY_HELP}/>:
    <ScrollCue axis="y" label="Recruiter notifications" className="mt-3 min-w-0" viewportClassName="max-h-80"><ul role="list" aria-label="Recent recruiter notifications" className="min-w-0 space-y-[6px] px-3">{state.items.map(item=><li key={item.id}>
     <Link href={item.href} onClick={()=>setOpen(false)} className="grid min-h-11 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1 rounded-[8px] sm:flex sm:gap-2 border border-[rgba(229,233,240,0.6)] bg-surface px-4 py-3 text-sm text-body transition-[background-color,border-color,box-shadow] duration-200 hover:border-[var(--lms-neutral-200)] hover:bg-[var(--lms-neutral-50)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.06)] active:shadow-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-[var(--lms-neutral-500)] motion-reduce:transition-none md:min-h-9">
      <span aria-hidden="true" className={item.unread?"mt-1.5 h-2 w-2 shrink-0 rounded-[var(--lms-radius-pill)] bg-[var(--lms-notification-unread,var(--lms-error))]":"mt-1.5 h-2 w-2 shrink-0 rounded-[var(--lms-radius-pill)] bg-muted"}/>
      <span className="min-w-0 break-words text-sm font-semibold leading-[1.4] sm:flex-1">{item.label}</span><time dateTime={item.at} className="col-start-2 break-words text-xs text-muted-foreground sm:col-auto sm:shrink-0">{relativeHrBellTime(item.at,now)}</time>
     </Link></li>)}</ul></ScrollCue>}

</>;
 return <div ref={rootRef} className="relative">
  <Button ref={triggerRef} type="button" aria-label={unread>0?"Notifications, "+unread+" unread":"Notifications, no unread items"}
   aria-expanded={open} aria-haspopup="dialog" aria-busy={loading} aria-controls={open?(mobile?"hr-topbar-mobile-notifications":"hr-topbar-desktop-notifications"):undefined}
   onClick={()=>setOpen(value=>!value)}
   variant="secondary" className="relative !h-11 !w-11 !min-w-11 !p-0 md:!h-9 md:!w-9 md:!min-w-9 hover:!bg-[rgba(0,0,0,0.035)] active:!bg-[rgba(0,0,0,0.06)] transition-[background-color] duration-[200ms] ease-[ease] motion-reduce:transition-none">
   <ShellNavGlyph name="bell"/>
   {unread>0?<span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-[var(--lms-radius-pill)] bg-[var(--lms-error)] px-1 text-xs leading-3 text-white">{unread>99?"99+":unread}</span>:null}
  </Button>
  {mobile ? <Drawer id="hr-topbar-mobile-notifications" open={open} onOpenChange={setOpen} title="Recruiter notifications" className={style.hrNotificationDrawer} bodyClassName={style.hrNotificationDrawerBody} footer={panelFooter}>
   {panelBody}
  </Drawer> : open ? <PopoverPanel id="hr-topbar-desktop-notifications" label="Recruiter notifications" className={style.hrNotificationPopover}
    onDismiss={()=>{setOpen(false);triggerRef.current?.focus();}}>
   <div className={style.hrNotificationHeader}>
    <h2>Recruiter notifications</h2>
    <Button variant="ghost" size="sm" type="button" onClick={()=>{setOpen(false);triggerRef.current?.focus();}}>Close</Button>
   </div>
   <div className={style.hrNotificationBody}>{panelBody}</div>
   <div className={style.hrNotificationFooter}>{panelFooter}</div>
  </PopoverPanel> : null}
 </div>;
}
