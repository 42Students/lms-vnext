import type {RecruiterReportRow} from "./recruiter-company-reports-model";

/** Display roles only from authorized, currently published employer drives.
 * Completed, draft and archived jobs are historical, not live opportunities. */
export function recruiterCompanyActiveRoles(
 rows:readonly {job:{title:string;status:string;archivedAt:Date|null}}[],
 maxRoles=8,
):string[] {
 const names:string[]=[];
 const seen=new Set<string>();
 for(const row of rows){
  if(row.job.status!=="PUBLISHED"||row.job.archivedAt!==null)continue;
  const title=row.job.title.trim();
  const key=title.toLocaleLowerCase("en");
  if(!title||seen.has(key))continue;
  seen.add(key);names.push(title);
  if(names.length>=maxRoles)break;
 }
 return names;
}
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
