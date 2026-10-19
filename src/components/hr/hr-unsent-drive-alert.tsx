"use client";
import { Button } from "@/components/ui/button";
import {useEffect,useState} from "react";
import {ConfirmActionDialog} from "@/components/ui/confirm-action-dialog";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {restoreHrUnsentDraft,clearHrUnsentDraftStores} from "@/modules/placements/hr-unsent-draft-storage-model";
/** REC-home-drives-17: only a scoped, saved, validated draft can be continued. */
export function HrUnsentDriveAlert({storageKey,collegeId}:{storageKey:string;collegeId:string}){
 const [hasDraft,setHasDraft]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{
  function readDraft(){
   try{
    const local=restoreHrUnsentDraft(window.localStorage.getItem(storageKey),Date.now());
    const session=restoreHrUnsentDraft(window.sessionStorage.getItem(storageKey),Date.now());
    setHasDraft(Boolean(local||session));
   }catch{setHasDraft(false);}
  }
  readDraft();
  window.addEventListener("storage",readDraft);
  window.addEventListener("focus",readDraft);
  return ()=>{
   window.removeEventListener("storage",readDraft);
   window.removeEventListener("focus",readDraft);
  };
 },[storageKey]);
 if(!hasDraft)return null;
 return <aside role="status" className="rounded-[var(--lms-control-radius)] border border-warning bg-[var(--lms-warning-subtle)] p-4">
   <p className="font-semibold text-foreground">You have a drive request you haven&apos;t sent yet</p>
   <p className="mt-1 text-sm text-body">It is saved on this device.</p>
   <Link href={"/hr/drives/new?collegeId="+encodeURIComponent(collegeId)}
    className="mt-3 inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
    Continue
   </Link>
   <Button variant="ghost" type="button"
    className="ml-3 underline"
    onClick={()=>{setError("");setConfirmDiscard(true);}}>Discard saved draft</Button>
   <ConfirmActionDialog open={confirmDiscard}
    title="Discard the unsent drive request saved on this device?"
    consequence="This removes your saved draft from this browser. It has not been submitted."
    confirmLabel="Discard saved draft"
    onCancel={()=>setConfirmDiscard(false)}
    onConfirm={()=>{
      let cleared=false;
      try{
        cleared=clearHrUnsentDraftStores(
         [window.localStorage,window.sessionStorage],storageKey);
      }catch{/* Browsers can throw even while accessing storage properties. */}
      if(!cleared){
        setError("Could not clear this saved draft. Try again or continue editing.");
        setConfirmDiscard(false);return;
      }
      setHasDraft(false);setConfirmDiscard(false);setError("");
    }}/>
   {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
 </aside>;
}
