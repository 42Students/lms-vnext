"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function AdminRevokeSessions({collegeId,userId,count}:{collegeId:string;userId:string;count:number}){
 const router=useRouter();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function revoke(){
  if(busy||count<1||!window.confirm("Sign out everywhere? All active sessions for this administrator, including other colleges, will be revoked immediately."))return;
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/admin/colleges/"+encodeURIComponent(collegeId)+"/sessions",{
    method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
    body:JSON.stringify({userId,confirm:true}),
   });
   if(!response.ok)throw Error("Could not revoke sessions. Recheck your admin access and retry.");
   const result=await response.json() as {revoked:number};
   setMessage(result.revoked+" session(s) revoked.");router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"Revocation failed.");}
  finally{setBusy(false);}
 }
 return <div className="space-y-2">
  <button type="button" disabled={busy||count<1} onClick={()=>void revoke()}
   className="min-h-11 rounded-md border border-error px-4 font-semibold text-error disabled:opacity-50">
   {busy?"Signing out…":"Sign out everywhere"}
  </button>
  <p className="text-xs text-muted-foreground">Revokes all active sessions for this person, across every college. This action is audited.</p>
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
 </div>;
}
