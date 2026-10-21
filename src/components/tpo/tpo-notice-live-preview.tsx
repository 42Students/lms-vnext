"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {TpoNoticeScheduleControls} from "@/components/tpo/tpo-notice-schedule-controls";
import {canPublishTpoNoticeWithCurrentStorage} from "@/modules/announcements/tpo-notice-audience-snapshot-model";

type PreviewState={status:"loading"|"ready"|"invalid"|"failed";count:number|null;audience:string};
const Context=createContext<PreviewState|null>(null);
function usePreview():PreviewState{
 const value=useContext(Context);
 if(!value)throw new Error("TPO_NOTICE_PREVIEW_PROVIDER_REQUIRED");
 return value;
}
/** Preview in-place. Audience controls live inside the POST form so the
 * authorized preview and published target ALWAYS use the same FormData.
 * Never navigate or discard the draft to estimate reach. */
export function TpoNoticeLiveAudienceProvider({formId,children}:{formId:string;children:ReactNode}){
 const [preview,setPreview]=useState<PreviewState>({status:"loading",count:null,audience:"PLACEMENTS"});
 useEffect(()=>{
  const form=document.getElementById(formId);
  if(!(form instanceof HTMLFormElement))return;
  let generation=0,timeout:ReturnType<typeof setTimeout>|null=null;
  const update=()=>{
   const current=++generation;
   if(timeout!==null)clearTimeout(timeout);
   const data=new FormData(form);
   const audience=String(data.get("audience")??"");
   const ids=data.getAll("targetIds").map(String);
   const target=String(data.get("targetId")??"").trim();
   const selectionMissing=(audience==="BATCHES"||audience==="BRANCHES")&&ids.length===0||
    audience==="DRIVE"&&!target;
   if(selectionMissing||!["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"].includes(audience)){
    setPreview({status:"invalid",count:null,audience});return;
   }
   setPreview({status:"loading",count:null,audience});
   timeout=setTimeout(()=>{
    const params=new URLSearchParams({audience});
    if(target)params.set("targetId",target);
    for(const id of ids)params.append("targetIds",id);
    void fetch("/api/placements/tpo/announcements/preview?"+params.toString(),{
     method:"GET",credentials:"same-origin",cache:"no-store",headers:{"Accept":"application/json"},
    }).then(async response=>{
     if(!response.ok)throw new Error("PREVIEW_UNAVAILABLE");
     const value:unknown=await response.json();
     if(!value||typeof value!=="object")throw new Error("PREVIEW_UNAVAILABLE");
     const count=(value as Record<string,unknown>).potentiallyVisibleMemberships;
     if(typeof count!=="number"||!Number.isInteger(count)||count<0)
      throw new Error("PREVIEW_UNAVAILABLE");
     if(current===generation)setPreview({status:"ready",count,audience});
    }).catch(()=>{
     if(current===generation)setPreview({status:"failed",count:null,audience});
    });
   },250);
  };
  form.addEventListener("change",update);
  update();
  return ()=>{
   generation++;
   if(timeout!==null)clearTimeout(timeout);
   form.removeEventListener("change",update);
  };
 },[formId]);
 return <Context.Provider value={preview}>{children}</Context.Provider>;
}
export function TpoNoticeLiveReach({targetedReady}:{targetedReady:boolean}){
 const preview=usePreview();
 return <div aria-live="polite" role="status"
   className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] px-3 py-2 text-sm leading-5 text-body">
   {preview.status==="loading"?"Checking who this announcement reaches…":
    preview.status==="invalid"?"Pick who it is for to see how many it reaches.":
    preview.status==="failed"?"Couldn't work out who it reaches. Check the audience or try again.":
    <>Goes to <strong>{preview.count} {preview.count===1?"student":"students"}</strong> · {preview.audience==="COLLEGE"?"All students":"Students in "+preview.audience.toLowerCase()}</>}
   {preview.status==="ready"?<p className="mt-1 text-xs text-muted-foreground">An estimate of active college memberships, not a send or delivery count. Email is unavailable.</p>:null}
   {preview.status==="ready"&&!canPublishTpoNoticeWithCurrentStorage(preview.audience,targetedReady)?
    <p className="mt-1 text-xs text-[var(--lms-warning-text)]">Targeted recipient storage is not ready. Publishing to this audience is unavailable.</p>:null}
 </div>;
}
export function TpoNoticeLiveSubmitControls({minDateTime,targetedReady}:{minDateTime:string;targetedReady:boolean}){
 const preview=usePreview();
 return <TpoNoticeScheduleControls minDateTime={minDateTime}
  count={preview.status==="ready"?preview.count:null}
  enabled={preview.status==="ready"&&preview.count!==null&&preview.count>0&&
   canPublishTpoNoticeWithCurrentStorage(preview.audience,targetedReady)}/>;
}
