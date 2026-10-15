export function tpoRegistrationHistoryChangeLabel(previousChoice:string|null,nextChoice:string):string {
 return (previousChoice??"NOT_RECORDED")+" → "+nextChoice;
}
export function tpoRegistrationHistorySourceLabel(source:string):string {
 if(source==="SELF")return "Learner self-service";
 if(source==="TPO")return "Placement-cell recorded";
 if(source==="BACKFILL")return "Historical backfill";
 return "Recorded source unavailable";
}
