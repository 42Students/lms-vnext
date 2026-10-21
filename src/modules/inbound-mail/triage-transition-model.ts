import {
  inboundMailRoutingStatuses,
  inboundMailRoutingStatusLabels,
  type InboundMailRoutingStatus,
} from "./message-model";

export type InboundMailStatus = "NEW" | "TRIAGED" | "RESOLVED";

/** Routing outcomes are historical transport facts; triage is a separate
 * staff workflow. Never overwrite or reinterpret routing when marking resolved.
 */
export type InboundMailTriageRecord = {
  triageStatus: InboundMailStatus;
  routingStatus: InboundMailRoutingStatus;
};

export function inboundMailRoutingStatusDetails(value: string): {
  status: InboundMailRoutingStatus;
  label: string;
} | null {
  if (!(inboundMailRoutingStatuses as readonly string[]).includes(value)) return null;
  const status = value as InboundMailRoutingStatus;
  return { status, label: inboundMailRoutingStatusLabels[status] };
}

export function transitionInboundMailTriage(
  record: InboundMailTriageRecord, to: InboundMailStatus,
): InboundMailTriageRecord | null {
  if (!inboundMailStatusTransitionAllowed(record.triageStatus, to)) return null;
  return { ...record, triageStatus: to };
}

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
