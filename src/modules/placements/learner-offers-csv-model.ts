import {learnerSafeCsvCell} from "./learner-csv-safe-cell-model";
import {learnerOfferCtc} from "./learner-offer-ctc-model";
import type {LearnerPlacementOfferItem} from "@/components/placements/learner-placement-offers";
/** Displayed, own-membership offer metadata only. No employer credentials or file links. */
export function learnerOffersCsv(rows:readonly LearnerPlacementOfferItem[]){
 const columns=["Employer","Role","Document kind","Response","Annual CTC (INR)","Issued (UTC)","Expires (UTC)","Joining result"];
 const values=rows.map(r=>[
  r.companyName,r.roleTitle,r.kind==="LOI"?"LOI":"OFFER",r.status,
  learnerOfferCtc(r.annualCtcInr)===null?"":String(learnerOfferCtc(r.annualCtcInr)),r.issuedAt,r.expiresAt??"",r.joining?.status??"",
 ]);
 return "\uFEFF"+[columns,...values].map(r=>r.map(learnerSafeCsvCell).join(",")).join("\r\n")+"\r\n";
}
