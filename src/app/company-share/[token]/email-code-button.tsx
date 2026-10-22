"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";

const SUCCESS="We emailed a code to your verified recruiter account. It works for 15 minutes.";
/** No recipient email is accepted from this public UI. The server verifies a
 * live recruiter/company/college grant and sends only to that account. */
export function ShareEmailCodeButton({token}:{token:string}){
 const [pending,setPending]=useState(false),[error,setError]=useState("");
 const {showToast}=useToast();
 async function send(){
  if(pending)return;
  setPending(true);setError("");
  try{
   const response=await fetch("/api/company-share/"+encodeURIComponent(token)+"/email-code",{
    method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:"{}",
   });
   if(!response.ok){
    const detail=response.status===429?
     (response.headers.get("Retry-After")==="60"?
      "A code was sent recently. You can ask for another after one minute.":
      "Too many email requests. Ask the placement cell or try again after one hour."):
     response.status===503?"Email code delivery is not available. Ask the placement cell for the code.":
     response.status===401||response.status===403?
      "Sign in with your authorized recruiter account to request an email code.":
      "Could not request an email code. Ask the placement cell.";
    throw new Error(detail);
   }
   showToast({tone:"success",title:SUCCESS});
  }catch(cause){
   const message=cause instanceof Error?cause.message:"Could not request an email code.";
   setError(message);showToast({tone:"error",title:"Code email was not sent",description:message});
  }finally{setPending(false);}
 }
 return <div className="min-w-0 space-y-2">
  <Button variant="secondary" type="button" loading={pending} disabled={pending}
   className="min-h-11 w-full md:min-h-9"
   onClick={()=>void send()}>Email me a code instead</Button>
  {error?<p role="alert" className="text-xs leading-[20px] text-error">{error}</p>:null}
 </div>;
}
