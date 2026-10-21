import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoPlacementSeasonSettings} from "./tpo-settings-read-service";

/** Legacy used a separate isCurrent flag. The vNext schema currently has
 * ACTIVE/CLOSED only, and its unique index allows one ACTIVE season per
 * college. Treat this as a derived default, not persisted isCurrent.
 * Never create or activate a season during a GET.
 */
export async function getCurrentTpoPlacementSeason(context:RequestContext){
 const {seasons}=await getTpoPlacementSeasonSettings(context);
 const active=seasons.filter(season=>season.status==="ACTIVE");
 const current=[...active].sort((a,b)=>
  b.startDate.localeCompare(a.startDate)||b.updatedAt.localeCompare(a.updatedAt))[0]??null;
 return {
  current,
  selectionSource:current?"DERIVED_ACTIVE":"NONE",
  activeSeasonCount:active.length,
  registration:{
   supported:false as const,
   isOpen:null,
   deadline:null,
   blockedDates:[] as readonly {date:string;label:string}[],
   message:"Season registration opening and deadline are not configured in vNext. An active placement season does not mean registration is open.",
  },
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
