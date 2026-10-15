import type {VerificationQueueFilters} from "./queue-filters";
const HOUR=3600000;
/** Backlog age is elapsed duration, not rounded calendar days. */
export function matchesVerificationAgeBand(submittedAt:Date,status:string,band:VerificationQueueFilters["ageBand"],now:Date):boolean{
 if(band==="ANY")return true;
 if(status!=="SUBMITTED"&&status!=="UPDATE_PENDING")return false;
 const hours=(now.getTime()-submittedAt.getTime())/HOUR;
 if(!Number.isFinite(hours)||hours<0)return false;
 if(band==="WITHIN_48_HOURS")return hours<48;
 if(band==="TWO_TO_SEVEN_DAYS")return hours>=48&&hours<168;
 return hours>=168;
}

/** Elapsed-time SQL bounds evaluated at the same clock as in-memory flags. */
export function verificationAgeSqlBounds(band:"ANY"|"WITHIN_48_HOURS"|"TWO_TO_SEVEN_DAYS"|"OVER_SEVEN_DAYS",now:Date){
 const at=now.getTime();
 if(band==="WITHIN_48_HOURS")return {after:new Date(at-48*HOUR),through:now};
 if(band==="TWO_TO_SEVEN_DAYS")return {after:new Date(at-168*HOUR),through:new Date(at-48*HOUR)};
 if(band==="OVER_SEVEN_DAYS")return {through:new Date(at-168*HOUR)};
 return {};
}
