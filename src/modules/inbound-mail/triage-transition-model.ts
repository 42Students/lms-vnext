export type InboundMailStatus = "NEW" | "TRIAGED" | "RESOLVED";

/** The NEW -> RESOLVED shortcut remains valid for items requiring no follow-up.
 * Completed items must be reopened before active handling can resume.
 */
export function inboundMailStatusTransitionAllowed(from: InboundMailStatus,to: InboundMailStatus):boolean {
 if(from===to)return false;
 if(from==="NEW")return to==="TRIAGED"||to==="RESOLVED";
 if(from==="TRIAGED")return to==="NEW"||to==="RESOLVED";
 return to==="NEW";
}

export function inboundMailStatusActions(status:string):readonly {status:InboundMailStatus;label:string}[]{
 switch(status){
 case "NEW":return [{status:"TRIAGED",label:"Mark being handled"},{status:"RESOLVED",label:"Mark done"}];
 case "TRIAGED":return [{status:"NEW",label:"Move back to To read"},{status:"RESOLVED",label:"Mark done"}];
 case "RESOLVED":return [{status:"NEW",label:"Move back to To read"}];
 default:return []; // A corrupt or future status must never crash the private inbox.
 }
}
