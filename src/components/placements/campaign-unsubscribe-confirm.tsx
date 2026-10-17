"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
/** Public unsubscribes are user-confirmed POSTs. Failed saves never claim success. */
export function CampaignUnsubscribeConfirm({token,cell}:{token:string;cell:boolean}){
 const router=useRouter(),pendingRef=useRef(false);
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 async function confirm(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pendingRef.current)return;
  pendingRef.current=true;setPending(true);setError("");
  const controller=new AbortController();
  const timeout=window.setTimeout(()=>controller.abort(),12000);
  try{
   const data=new FormData();data.set("token",token);
   const response=await fetch("/api/public/campaign-unsubscribe",{
    method:"POST",body:data,credentials:"same-origin",signal:controller.signal,
   });
   const url=new URL(response.url);
   if(!response.ok||!response.redirected||url.origin!==window.location.origin||
    url.pathname!=="/campaign-unsubscribe/confirmed")
    throw new Error("UNCONFIRMED");
   router.push(url.pathname+url.search);
  }catch{setError("That didn't work. Please try again.");}
  finally{window.clearTimeout(timeout);pendingRef.current=false;setPending(false);}
 }
 return <form onSubmit={event=>void confirm(event)} className="mt-4 space-y-3">
  {error?<p role="alert" className="text-sm text-danger">{error}</p>:null}
  <button type="submit" disabled={pending}
   className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
   {pending?"Saving…":cell?"Unsubscribe":"Confirm unsubscribe"}
  </button>
 </form>;
}
