export type BatchCounts={eligible:number;ineligible:number;undecided:number;invited:number;applied:number;placed:number;finished:boolean};
export function batchDecisionBar(c:BatchCounts){const total=c.eligible+c.ineligible+c.undecided;return {total,eligiblePercent:total?100*c.eligible/total:0,ineligiblePercent:total?100*c.ineligible/total:0,undecidedPercent:total?100*c.undecided/total:0};}
export function batchNextStep(c:BatchCounts){if(c.finished)return "VIEW";if(c.undecided>0)return "DECIDE";if(c.invited<c.eligible)return "INVITE";if(c.applied<c.invited)return "REMIND";return "REVIEW";}
