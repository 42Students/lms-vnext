/** TPO-calendar-reports-49: per-company engagement from exactly recorded CRM events.
 * Never infer contact from lead creation or invite/open timestamps. */
export type TpoCompanyEngagementLead={
 id:string;companyRelationshipId:string|null;companyName:string|null;
 inviteSentAt:Date|string|null;recruiterUserId:string|null;
};
export type TpoCompanyEngagementRow={
 companyRelationshipId:string;companyName:string;leads:number;contacts:number;
 invited:number;joined:number;
};
export function buildTpoCompanyEngagement(
 leads:readonly TpoCompanyEngagementLead[],
 contactEvents:readonly {leadId:string}[],
):TpoCompanyEngagementRow[]{
 const contacts=new Map<string,number>();
 for(const event of contactEvents)contacts.set(event.leadId,(contacts.get(event.leadId)??0)+1);
 const grouped=new Map<string,TpoCompanyEngagementRow>();
 for(const lead of leads){
  if(!lead.companyRelationshipId)continue;
  let row=grouped.get(lead.companyRelationshipId);
  if(!row){
   row={companyRelationshipId:lead.companyRelationshipId,companyName:lead.companyName?.trim()||"Unnamed company",
    leads:0,contacts:0,invited:0,joined:0};
   grouped.set(lead.companyRelationshipId,row);
  }
  row.leads+=1;row.contacts+=contacts.get(lead.id)??0;
  if(lead.inviteSentAt)row.invited+=1;
  if(lead.recruiterUserId)row.joined+=1;
 }
 return [...grouped.values()].sort((a,b)=>a.companyName.localeCompare(b.companyName,"en-IN"));
}

export type TpoCompanyPlacementRow={
 companyId:string;companyName:string;drives:number;placed:number;
};
export function joinTpoCompanyEngagementWithPlacement(
 engagement:readonly (TpoCompanyEngagementRow&{companyId:string|null})[],
 placements:readonly TpoCompanyPlacementRow[],
 ranDrives:ReadonlyMap<string,number>=new Map(),
){
 const placementsById=new Map(placements.map(row=>[row.companyId,row]));
 const used=new Set<string>();
 const rows=engagement.map(row=>{
  const placement=row.companyId?placementsById.get(row.companyId):null;
  if(row.companyId)used.add(row.companyId);
  return {...row,drives:placement?.drives??0,placed:placement?.placed??0,
   ranDrives:row.companyId?ranDrives.get(row.companyId)??0:0};
 });
 for(const placement of placements){
  if(used.has(placement.companyId))continue;
  rows.push({companyRelationshipId:"",companyId:placement.companyId,
   companyName:placement.companyName,leads:0,contacts:0,invited:0,joined:0,
   drives:placement.drives,placed:placement.placed,
   ranDrives:ranDrives.get(placement.companyId)??0});
 }
 return rows.sort((a,b)=>a.companyName.localeCompare(b.companyName,"en-IN"));
}
