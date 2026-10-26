/** Model the old LMS Today headline without treating partial data as zero work. */
const words=["","One thing needs","Two things need","Three things need","Four things need","Five things need","Six things need"];
export function recruiterTodayHasDriveHistory(input:{
 verifiedJobCount:number;requestCount:number|null;jobPreviewCapped:boolean;
}):boolean|null{
 if(input.verifiedJobCount>0||input.jobPreviewCapped)return true;
 return input.requestCount===null?null:input.requestCount>0;
}
export function recruiterTodayHeadline(
 greeting:string,visibleActions:number,hasDriveHistory:boolean|null,postponed=0,
):string{
 const salutation=greeting.replace(/\.$/,"").trim();
 const prefix=salutation?salutation+". ":"";
 if(Number.isSafeInteger(visibleActions)&&visibleActions>0)
  return prefix+(words[visibleActions]??visibleActions+" things need")+" you.";
 if(Number.isSafeInteger(postponed)&&postponed>0)
  return prefix+postponed+" "+(postponed===1?"thing is":"things are")+" put off for later.";
 if(hasDriveHistory===false)return prefix+"Let's get your first drive going.";
 if(hasDriveHistory===true)return prefix+"You're all caught up.";
 return salutation?salutation+".":"Today";
}
