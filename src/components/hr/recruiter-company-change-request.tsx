"use client";
import {useState} from "react";
import {Textarea} from "@/components/ui/textarea";
import {recruiterCompanyChangeRequest} from "@/modules/placements/recruiter-company-change-request-model";
type Props={collegeId:string;companyName:string;kind:"PROFILE"|"TEAM";
 teammate?:{email:string|null;name:string|null}};
export function RecruiterCompanyChangeRequest({collegeId,companyName,kind,teammate}:Props){
 const [detail,setDetail]=useState("");
 const [ack,setAck]=useState(false);
 const message=recruiterCompanyChangeRequest({companyName,kind,detail,teammate});
 return <details className="mt-2 min-w-0 rounded-lg border border-border p-2">
  <summary className="min-h-9 cursor-pointer py-2 text-sm font-semibold text-primary-text underline">
   {kind==="TEAM"?"Change access":"Edit company details"}
  </summary>
  <form method="post" action="/api/placements/recruiter/conversations/open"
   aria-label={kind==="TEAM"?"Request teammate access change":"Request company profile correction"}
   className="mt-3 space-y-2">
   <input type="hidden" name="collegeId" value={collegeId}/>
   <input type="hidden" name="message" value={message??""}/>
   <p className="text-xs text-body">{kind==="TEAM"?
    "Describe the access the placement cell should review for this teammate. Only the placement cell can approve and change grants.":
    "Describe the correction to your company's name, website, about details or hiring profile. The placement cell checks it before saving."}</p>
   <label className="grid gap-1 text-xs font-medium text-foreground">
    Requested change
    <Textarea value={detail} onChange={event=>{setDetail(event.target.value);setAck(false);}}
     rows={3} maxLength={1800} required placeholder={kind==="TEAM"?
      "Please review which drives this colleague may access and why…":
      "Please update our company website to…"} />
   </label>
   <label className="flex min-h-11 items-center gap-2 text-xs text-body">
    <input type="checkbox" checked={ack} onChange={event=>setAck(event.target.checked)}/>
    This request does not immediately change verified company information or teammate access.
   </label>
   <button type="submit" disabled={!ack||message===null}
    className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-secondary px-3 text-sm font-semibold text-primary-text disabled:cursor-not-allowed disabled:opacity-40">
    Send to placement cell
   </button>
  </form>
 </details>;
}
