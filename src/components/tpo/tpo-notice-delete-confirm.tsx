"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";

/** Keep destructive confirmation in context, including stale-version failures. */
export function TpoNoticeDeleteConfirm({id,version}:{id:string;version:number}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [submitting,setSubmitting]=useState(false);
 const [error,setError]=useState("");
 const pending=useRef(false);
 const confirmButton=useRef<HTMLButtonElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(open)confirmButton.current?.focus();
 },[open]);

 function dismiss(){
  if(pending.current)return;
  setOpen(false);
  setError("");
  trigger.current?.focus();
 }

 async function deleteNotice(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending.current)return;
  pending.current=true;setSubmitting(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle",{
    method:"POST",credentials:"same-origin",
    headers:{Accept:"application/json"},
    body:new FormData(event.currentTarget),
   });
   if(!response.ok){
    throw new Error(response.status===409
     ?"This announcement changed since you opened it. Refresh the list and review it before deleting."
     :response.status===403
      ?"You no longer have permission to delete this announcement."
      :response.status===503
       ?"Announcements are temporarily unavailable. Try again later."
       :"The announcement could not be deleted. Please try again.");
   }
   const result:unknown=await response.json().catch(()=>null);
   if(!result||typeof result!=="object"||!("saved" in result)||result.saved!==true)
    throw new Error("Deletion could not be confirmed. Refresh announcements before trying again.");
   setOpen(false);
   router.push("/tpo/announcements?tab=yours&noticeSuccess=DELETED");
   router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:"The announcement could not be deleted.");
  }finally{
   pending.current=false;
   setSubmitting(false);
  }
 }

 return <div className="min-w-0">
  <Button ref={trigger} variant="danger" type="button" className="min-h-9 px-3 text-xs font-semibold"
   onClick={()=>{setError("");setOpen(true);}}>
   Delete
  </Button>
  <Dialog open={open}
   onOpenChange={next=>{if(pending.current)return;if(!next)dismiss();else setOpen(true);}}
   dismissible={!submitting}
   role="alertdialog" className="max-w-sm" bodyClassName="p-0"
   title="Delete this announcement?"
   description="Students stop seeing it, and its notices are taken back."
   footer={<form method="post"
      action={"/api/placements/tpo/announcements/"+encodeURIComponent(id)+"/lifecycle"}
      onSubmit={event=>void deleteNotice(event)}
      className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <input type="hidden" name="expectedVersion" value={version}/>
      <input type="hidden" name="action" value="DELETE"/>
      <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9"
       disabled={submitting} onClick={dismiss}>Cancel</Button>
      <Button ref={confirmButton} type="submit" variant="danger"
       className="min-h-11 w-full sm:w-auto md:min-h-9"
       loading={submitting} disabled={submitting}>
       {submitting?"Deleting…":"Delete announcement"}
      </Button>
    </form>}>
    {error?<p role="alert" className="px-4 py-3 text-sm text-error">{error}</p>:null}
  </Dialog>
 </div>;
}
