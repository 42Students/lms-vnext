import {resolveRegistrationWindow,type RegistrationWindow} from "./batch-registration-policy";
export type TpoInvitationReadiness="NOT_CONFIGURED"|"NOT_MARKED"|"OPEN"|"DEADLINE_PASSED"|"FINISHED";
export function getTpoInvitationReadiness(lifecycle:RegistrationWindow|null,now:Date):{
 stage:TpoInvitationReadiness;deadline:string|null;markedAt:string|null;
}{
 if(!lifecycle)return {stage:"NOT_CONFIGURED",deadline:null,markedAt:null};
 const window=resolveRegistrationWindow(lifecycle,now);
 const stage:TpoInvitationReadiness=window.finished?"FINISHED":
  !window.invited?"NOT_MARKED":window.open?"OPEN":"DEADLINE_PASSED";
 return {stage,deadline:lifecycle.deadline?.toISOString()??null,
  markedAt:lifecycle.invitedAt?.toISOString()??null};
}
