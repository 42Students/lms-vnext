import {placementReportCsv,countsAsPlacedByCollegeRule} from "./report-model";

/** One student, not one offer; no duplicate learner even if they hold many offers. */
export type AccreditationStudentOffer={
 membershipId:string;offerId:string;name:string|null;rollNumber:string|null;
 programme:string;branch:string;batch:string;company:string;
 status:string;annualCtcInr:number|null;joining:string|null;kind?:string;
};
export type AccreditationStudentRow={
 membershipId:string;name:string|null;rollNumber:string|null;
 programme:string;branch:string;batch:string;employer:string;
 employerContact:string|null;packageInr:number|null;offersHeld:number;
 offerStatus:string;joining:string|null;
};
export const ACCREDITATION_STUDENT_HEADINGS=[
 "Name","Roll no.","Programme","Branch","Batch","Employer",
 "Employer contact","Package (best offer)","Offers held","Offer status","Joining",
] as const;
export const ACCREDITATION_STUDENT_WARNING=
 "Evidence only: employer contacts and historic placement-time attributes may be unavailable. Verify the batch, external placements, and official NAAC/NIRF requirements before submission.";
export function buildAccreditationStudentRows(offers:readonly AccreditationStudentOffer[],
 countsAsPlacedAt:"SELECTED"|"OFFER_RELEASED"|"OFFER_ACCEPTED"="OFFER_ACCEPTED"):AccreditationStudentRow[]{
 const members=new Map<string,AccreditationStudentOffer[]>();
 const seen=new Set<string>();
 for(const offer of offers){
  if(seen.has(offer.offerId))continue;
  seen.add(offer.offerId);
  const group=members.get(offer.membershipId)??[];
  group.push(offer);members.set(offer.membershipId,group);
 }
 const output:AccreditationStudentRow[]=[];
 for(const [membershipId,group] of members){
  const accepted=group.filter(x=>countsAsPlacedByCollegeRule({
   employmentType:"FULL_TIME",offerStatus:x.status,offerKind:x.kind,
   countsAsPlacedAt,
  }));
  if(accepted.length===0)continue;
  // Deterministic ordering: known best CTC first; never turn unknown pay into zero.
  const best=[...accepted].sort((a,b)=>(b.annualCtcInr??-1)-(a.annualCtcInr??-1)
   ||a.offerId.localeCompare(b.offerId))[0];
  output.push({membershipId,name:best.name,rollNumber:best.rollNumber,
   programme:best.programme,branch:best.branch,batch:best.batch,
   employer:best.company,employerContact:null,packageInr:best.annualCtcInr,
   offersHeld:group.filter(x=>x.status==="ACCEPTED"||x.status==="ISSUED").length,
   offerStatus:best.status,joining:best.joining});
 }
 return output.sort((a,b)=>(a.name??"").localeCompare(b.name??"")||
  (a.rollNumber??"").localeCompare(b.rollNumber??"")||a.membershipId.localeCompare(b.membershipId));
}
export function accreditationStudentCsv(rows:readonly AccreditationStudentRow[]):string{
 return placementReportCsv(ACCREDITATION_STUDENT_HEADINGS,[
  ...rows.map(row=>[row.name,row.rollNumber,row.programme,row.branch,row.batch,
   row.employer,row.employerContact,row.packageInr,row.offersHeld,row.offerStatus,row.joining]),
  // Warnings are a separate, unmistakable footer; never misrepresent as a student.
  ["WARNING",ACCREDITATION_STUDENT_WARNING],
 ]);
}
