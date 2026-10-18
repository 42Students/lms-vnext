export function tpoLiveRoundTiming(input:{scheduledAt:string|null;durationMinutes:number|null},asOf:string){
 if(!input.scheduledAt||input.durationMinutes===null||!Number.isSafeInteger(input.durationMinutes)||input.durationMinutes<=0)return {elapsedMinutes:null,remainingMinutes:null};
 const start=new Date(input.scheduledAt).getTime();
 const now=new Date(asOf).getTime();
 if(!Number.isFinite(start)||!Number.isFinite(now)||now<start)return {elapsedMinutes:null,remainingMinutes:null};
 const elapsed=Math.floor((now-start)/60000);
 return {elapsedMinutes:elapsed,remainingMinutes:Math.max(0,input.durationMinutes-elapsed)};
}
