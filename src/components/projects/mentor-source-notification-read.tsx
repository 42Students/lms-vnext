"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";

export function MentorSourceNotificationRead({receiptKey,read}:{receiptKey:string;read:boolean}){
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const router=useRouter();
 if(read)return <span className="text-xs text-muted-foreground">Read</span>;
 async function mark(){
   if(pending)return;
   setPending(true);setError("");
   try{
     await apiFetch("/api/mentor/notifications/source-read",{
       method:"POST",headers:{"content-type":"application/json"},
       body:JSON.stringify({key:receiptKey}),timeoutMs:12000,
     });
     router.refresh();
   }catch(caught){
     setError(caught instanceof Error?caught.message:"Could not save read state");
   }finally{setPending(false);}
 }
 return <div className="inline-flex flex-col items-start gap-1">
   <Button type="button" variant="secondary" size="sm"
     loading={pending} disabled={pending} onClick={()=>void mark()}>
      Mark read
   </Button>
   {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </div>;
}
