"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";

type Report={ran:boolean;busy:boolean;commit:string|null;imported:number;
 updates:number;refused:number;tampered:number;deleted:number;message:string};

export function IndependentFindingsSyncControl({ready}:{ready:boolean}){
 const router=useRouter();
 const busyRef=useRef(false);
 const [pending,setPending]=useState(false);
 const [notice,setNotice]=useState<{tone:"success"|"warning"|"error";text:string}|null>(null);
 async function run(){
  if(busyRef.current||!ready)return;
  busyRef.current=true;setPending(true);setNotice(null);
  try{
   const response=await fetch("/api/tracker/audit-findings/sync",{
    method:"POST",cache:"no-store",headers:{"Accept":"application/json"},
   });
   const json:unknown=await response.json().catch(()=>null);
   const result=(json&&typeof json==="object"&&"result" in json)
    ?(json as {result?:Report}).result:null;
   if(!response.ok||!result){
    setNotice({tone:response.status===409||response.status===503?"warning":"error",
     text:response.status===409?"Sync didn't run. Another import is already active.":
     response.status===503?"Sync didn't run. Import storage or credentials are not ready.":
     "Sync failed. The existing findings have not been replaced."});return;
   }
   if(!result.ran){
    setNotice({tone:"warning",text:"Sync didn't run. "+result.message});return;
   }
   const changed=result.imported+result.updates;
   const warnings=result.refused+result.tampered+result.deleted;
   setNotice({tone:warnings?"warning":"success",
    text:(warnings?"Synced with warnings. ":"Synced. ")+
     changed+" imported/updated; "+warnings+" rejected, changed or deleted source files."});
   router.refresh();
  }catch{
   setNotice({tone:"error",text:"Sync failed. Check your connection and retry."});
  }finally{busyRef.current=false;setPending(false);}
 }
 return <div className="flex min-w-0 flex-wrap items-center gap-3" aria-label="Audit findings synchronization">
  <Button variant="secondary" type="button" className="min-h-11 md:min-h-9"
   disabled={!ready||pending} onClick={()=>void run()}>
   {pending?"Syncing…":"Sync now"}
  </Button>
  {!ready?<span role="status" className="text-xs text-muted-foreground">
   Repository importer is not verified or configured on this deployment.
  </span>:null}
  {notice?<Alert tone={notice.tone}>{notice.text}</Alert>:null}
 </div>;
}
