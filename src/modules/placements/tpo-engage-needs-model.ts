export type EngageNeed = "ALL" | "UNASSIGNED" | "NOT_CONTACTED";
export type EngageLead = {ownerMembershipId:string|null;manualStage:string;inviteSentAt:string|null;unsubscribedAt:string|null};
export function matchesEngageNeed(lead:EngageLead,need:EngageNeed):boolean {
 if(need==="ALL")return true;
 if(lead.unsubscribedAt||lead.manualStage==="NOT_NOW")return false;
 if(need==="UNASSIGNED")return lead.ownerMembershipId===null;
 return lead.manualStage==="NEW" && lead.inviteSentAt===null;
}
export function engageNeedsCounts(leads:readonly EngageLead[]) {
 return {all:leads.length,
  unassigned:leads.filter(item=>matchesEngageNeed(item,"UNASSIGNED")).length,
  notContacted:leads.filter(item=>matchesEngageNeed(item,"NOT_CONTACTED")).length};
}
