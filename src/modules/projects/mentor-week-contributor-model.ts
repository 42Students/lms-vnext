/** A comparison of recorded project actions—not attendance, login,
 * participation quality, time spent, or a personal risk score.
 */
export type MentorWeekContributor={membershipId:string;name:string;eventCount:number};
export function mentorFewestRecordedContributors(
 input:readonly MentorWeekContributor[],
):{kind:"UNAVAILABLE"}|{kind:"RESULT";count:number;members:MentorWeekContributor[]}{
 if(input.length<2)return {kind:"UNAVAILABLE"};
 const valid=input.filter(row=>Number.isSafeInteger(row.eventCount)&&row.eventCount>=0);
 if(valid.length!==input.length)return {kind:"UNAVAILABLE"};
 const min=Math.min(...valid.map(row=>row.eventCount));
 return {kind:"RESULT",count:min,members:valid.filter(row=>row.eventCount===min)
   .sort((a,b)=>a.name.localeCompare(b.name)||a.membershipId.localeCompare(b.membershipId))};
}
