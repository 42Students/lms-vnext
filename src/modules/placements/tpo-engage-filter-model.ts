import type {TpoRecruiterLeadStage} from "./tpo-recruiter-lead-policy";
export type EngageRosterFilters={
 stage:string;query:string;owner:string;invite:string;status:string;source:string;
};
export type EngageRosterRow={
 stage:TpoRecruiterLeadStage;name:string;companyName:string|null;
 emailNorm:string|null;phoneNorm:string|null;
 ownerName:string|null;inviteStatus:string;source:string|null;
 recruiterUserId:string|null;unsubscribedAt:string|null;
};
export function filterEngageRoster<T extends EngageRosterRow>(
 rows:readonly T[],filters:EngageRosterFilters,extra:(row:T)=>boolean=()=>true,
):T[]{
 const query=filters.query.trim().toLowerCase();
 return rows.filter(row=>{
  if(!extra(row))return false;
  if(filters.stage!=="ALL"&&filters.stage!==row.stage)return false;
  if(filters.owner!=="ALL"&&filters.owner!==(row.ownerName??"UNASSIGNED"))return false;
  if(filters.invite!=="ALL"&&filters.invite!==row.inviteStatus)return false;
  if(filters.source!=="ALL"&&filters.source!==row.source)return false;
  if(filters.status==="JOINED"&&!row.recruiterUserId)return false;
  if(filters.status==="UNSUBSCRIBED"&&!row.unsubscribedAt)return false;
  if(filters.status==="NOT_JOINED"&&row.recruiterUserId)return false;
  if(!query)return true;
  return [row.name,row.companyName,row.emailNorm,row.phoneNorm].filter(Boolean)
   .join(" ").toLowerCase().includes(query);
 });
}
