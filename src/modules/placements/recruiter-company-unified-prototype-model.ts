import type {RecruiterReportRow} from "./recruiter-company-reports-model";
export type RecruiterCompanyHiringDisplay={
  id:string;title:string;status:string;applied:number;
  cleared:null;offered:number;joined:number;joiningRate:number|null;
};
/** Public model deliberately does NOT substitute shortlist counts for
 * completed/cleared rounds: the registered report lacks that precise fact. */
export function recruiterCompanyHiringDisplay(rows:readonly RecruiterReportRow[]):RecruiterCompanyHiringDisplay[]{
 return rows.map(row=>{
  const applied=Math.max(0,row.applications);
  const offered=Math.max(0,row.outstandingOffers+row.acceptedOffers+row.declinedOffers);
  const joined=Math.max(0,row.joinedOffers);
  return {id:row.id,title:row.title,status:row.status,applied,cleared:null,
    offered,joined,joiningRate:applied>0?Math.round(joined/applied*100):null};
 });
}
