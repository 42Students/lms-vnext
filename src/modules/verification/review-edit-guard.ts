/** Freeze the payload inputs once a reviewer has opened the confirmation. */
export function canEditVerificationDecision(saving:boolean,pendingAction:"VERIFY"|"SEND_BACK"|null):boolean{
 return !saving&&pendingAction===null;
}
