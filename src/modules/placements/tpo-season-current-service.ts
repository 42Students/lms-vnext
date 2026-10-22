import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoPlacementSeasonSettings} from "./tpo-settings-read-service";

/** Current choice and registration are independent facts. Persisted vNext
 * ACTIVE/CLOSED is not the legacy 'isCurrent' flag: its unique index allows
 * one ACTIVE season per college, so selection is explicitly a DERIVED fallback.
 * A GET must never create, activate, or open a season.
 */
export function legacyCurrentSeasonSelection<T extends {
 id:string;status:string;startDate:string;updatedAt:string;
}>(seasons:readonly T[],legacyCurrentIds:readonly string[]=[]){
 const known=new Set(seasons.map(row=>row.id));
 const explicitIds=legacyCurrentIds.filter(id=>known.has(id));
 const candidates=explicitIds.length?
  seasons.filter(row=>explicitIds.includes(row.id)):
  seasons.filter(row=>row.status==="ACTIVE");
 const current=[...candidates].sort((a,b)=>
  b.startDate.localeCompare(a.startDate)||b.updatedAt.localeCompare(a.updatedAt)||
  b.id.localeCompare(a.id))[0]??null;
 return {current,selectionSource:current?
   explicitIds.length?"LEGACY_IS_CURRENT" as const:"DERIVED_ACTIVE" as const:
   "NONE" as const,activeSeasonCount:seasons.filter(row=>row.status==="ACTIVE").length};
}
export function projectTpoSeasonRegistration(source:{
 registrationControlled:boolean;isRegistrationOpen:boolean;
 registrationDeadline:string|null;
}|null,now=new Date()){
 const configured=Boolean(source?.registrationControlled);
 const deadline=source?.registrationDeadline??null;
 const time=deadline?new Date(deadline).getTime():null;
 const effective=source&&configured?source.isRegistrationOpen&&
  (time===null||Number.isFinite(time)&&time>now.getTime()):null;
 return {
  supported:true as const,
  controlled:configured,
  // A closed registration gate cannot silently reopen because a season is ACTIVE.
  isOpen:effective,
  explicitlyOpen:configured?source!.isRegistrationOpen:null,
  deadline,
  requiresCohortInvitation:true as const,
  blockedDates:[] as readonly {date:string;label:string}[],
  blockedDatesSupported:false as const,
  message:!source?"No current placement season; cohort registration is separate.":
   !configured?"Registration is managed through individual cohort invitations; a season's ACTIVE status does not open it.":
   "The saved season registration window is "+(effective?"open":"closed")+
    ". A learner still needs a valid cohort invitation.",
 };
}
/** The old current picker could mark several seasons as current. Preserve its
 * independent flag in an imported crosswalk and choose the newest explicitly
 * flagged source, including a CLOSED season; never infer isCurrent from status.
 * The runtime fallback remains DERIVED_ACTIVE until the historical selection
 * is actually registered in the database.
 */
export async function getCurrentTpoPlacementSeason(context:RequestContext){
 const {seasons}=await getTpoPlacementSeasonSettings(context);
 const selected=legacyCurrentSeasonSelection(seasons);
 return {
  ...selected,
  registration:projectTpoSeasonRegistration(selected.current),
 };
}

/** A future registered registration-deadline write can accept this explicit
 * IST civil time format. Parsing is pure; this function does not persist,
 * open registration, or imply that the pending DB fields exist.
 */
export function parseLegacySeasonRegistrationDeadlineIst(raw:unknown):string{
 if(typeof raw!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(raw))
  throw new Error("Enter the registration deadline as YYYY-MM-DDTHH:mm in IST.");
 const datePart=raw.slice(0,10);
 const year=Number(raw.slice(0,4)),month=Number(raw.slice(5,7)),day=Number(raw.slice(8,10));
 const hour=Number(raw.slice(11,13)),minute=Number(raw.slice(14,16));
 if(month<1||month>12||day<1||hour>23||minute>59||
   new Date(Date.UTC(year,month-1,day)).toISOString().slice(0,10)!==datePart)
  throw new Error("Enter a valid registration deadline in IST.");
 return new Date(Date.UTC(year,month-1,day,hour,minute)-330*60_000).toISOString();
}
