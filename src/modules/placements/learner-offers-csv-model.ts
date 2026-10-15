import type {LearnerPlacementOfferItem} from "@/components/placements/learner-placement-offers";
function quoted(cell:string){
 const safe=/^[\s\uFEFF]*[=+@-]/u.test(cell)?"'"+cell:cell;
 return '"'+safe.replaceAll('"','""')+'"';
}
/** Displayed, own-membership offer metadata only. No employer credentials or file links. */
export function learnerOffersCsv(rows:readonly LearnerPlacementOfferItem[]){
 const columns=["Employer","Role","Document kind","Response","Annual CTC (INR)","Issued (UTC)","Expires (UTC)","Joining result"];
 const values=rows.map(r=>[
  r.companyName,r.roleTitle,r.kind==="LOI"?"LOI":"OFFER",r.status,
  r.annualCtcInr===null?"":String(r.annualCtcInr),r.issuedAt,r.expiresAt??"",r.joining?.status??"",
 ]);
 return "\uFEFF"+[columns,...values].map(r=>r.map(quoted).join(",")).join("\r\n")+"\r\n";
}
