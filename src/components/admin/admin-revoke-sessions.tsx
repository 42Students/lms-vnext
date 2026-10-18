import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function AdminRevokeSessions({collegeId,userId,count}:{collegeId:string;userId:string;count:number}){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 async function revoke(){
  if(busy||count<1)return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/sessions",{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({userId,confirm:true}),
   });
   if(!response.ok)throw Error("Could not revoke sessions. Recheck your admin access and retry.");
   const result=await response.json() as {revoked:number};
   setConfirmOpen(false);setMessage(result.revoked+" session(s) revoked.");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Revocation failed.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  <Button type="button" variant="danger" disabled={busy||count<1} onClick={()=>setConfirmOpen(true)}
   className="disabled:opacity-50">
   {busy?"Signing out…":"Sign out everywhere"}
  </Button>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Sign out everywhere?" description="All active sessions for this administrator, including other colleges, will be revoked immediately." confirmLabel="Sign out everywhere" pending={busy} onConfirm={()=>void revoke()}/>
  <p className="text-xs text-muted-foreground">Revokes all active sessions for this person, across every college. This action is audited.</p>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </div>;
}
