import type {TpoRecruiterLeadStage} from "./tpo-recruiter-lead-policy";
export type EngageRosterFilters={
 stage:string;query:string;owner:string;invite:string;status:string;source:string;
 company?:string;designation?:string;reach?:string;nextFollowup?:string;
 lastActivity?:string;added?:string;drives?:string;
};
export type EngageRosterRow={
 stage:TpoRecruiterLeadStage;name:string;companyName:string|null;
 emailNorm:string|null;phoneNorm:string|null;
 ownerName:string|null;inviteStatus:string;source:string|null;
 recruiterUserId:string|null;unsubscribedAt:string|null;
 designation?:string|null;nextFollowupAt?:string|null;lastActivityAt?:string|null;
 createdAt?:string;drivesRan?:number|null;
};
const DAY=86_400_000;
function isInRange(value:string|null|undefined,kind:string,now:number):boolean{
 const time=value?new Date(value).getTime():NaN;
 if(kind==="NONE"||kind==="NEVER")return !Number.isFinite(time);
 if(!Number.isFinite(time))return false;
 // Roster dates are college-local IST, not the browser machine timezone.
 const ist=new Date(now+330*60_000);
 const midnight=Date.UTC(ist.getUTCFullYear(),ist.getUTCMonth(),ist.getUTCDate())-330*60_000;
 switch(kind){
  // The legacy "due" bucket means overdue OR any time today in IST;
  // do not exclude a follow-up scheduled later on the current date.
  case "DUE":return time<midnight+DAY;
  case "OVERDUE":return time<midnight;
  case "TODAY":return time>=midnight&&time<midnight+DAY;
  case "NEXT_7":return time>=midnight+DAY&&time<midnight+8*DAY;
  case "LATER":return time>=midnight+8*DAY;
  case "LAST_7":return time>=now-7*DAY;
  case "LAST_30":return time>=now-30*DAY;
  case "OVER_30":return time<now-30*DAY;
  case "EARLIER":return time<now-30*DAY;
  default:return true;
 }
}
export function filterEngageRoster<T extends EngageRosterRow>(
 rows:readonly T[],filters:EngageRosterFilters,extra:(row:T)=>boolean=()=>true,
 now:number=new Date().getTime(),
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
  if(filters.company&&filters.company!=="ALL"&&filters.company!==row.companyName)return false;
  if(filters.designation&&filters.designation!=="ALL"&&!row.designation?.toLowerCase()
    .includes(filters.designation.toLowerCase()))return false;
  if(filters.drives&&filters.drives!=="ALL"){
   // Unknown drive counts must not be treated as zero.
   if(row.drivesRan==null)return false;
   if(filters.drives==="NONE"&&row.drivesRan!==0)return false;
   if(filters.drives==="ONE_TWO"&&(row.drivesRan<1||row.drivesRan>2))return false;
   if(filters.drives==="THREE_FIVE"&&(row.drivesRan<3||row.drivesRan>5))return false;
   if(filters.drives==="SIX_PLUS"&&row.drivesRan<6)return false;
  }
  if(filters.reach==="EMAIL"&&!row.emailNorm)return false;
  if(filters.reach==="PHONE"&&!row.phoneNorm)return false;
  if(filters.reach==="BOTH"&&!(row.emailNorm&&row.phoneNorm))return false;
  if(filters.reach==="EITHER"&&!(row.emailNorm||row.phoneNorm))return false;
  if(filters.reach==="NEITHER"&&(row.emailNorm||row.phoneNorm))return false;
  if(filters.nextFollowup&&filters.nextFollowup!=="ALL"&&
    !isInRange(row.nextFollowupAt,filters.nextFollowup,now))return false;
  if(filters.lastActivity&&filters.lastActivity!=="ALL"&&
    !isInRange(row.lastActivityAt,filters.lastActivity,now))return false;
  if(filters.added&&filters.added!=="ALL"&&
    !isInRange(row.createdAt,filters.added,now))return false;
  if(!query)return true;
  return [row.name,row.companyName,row.emailNorm,row.phoneNorm,row.designation,row.source].filter(Boolean)
   .join(" ").toLowerCase().includes(query);
 });
}
