/** Resource sharing provenance comes ONLY from immutable authorized audit events.
 * A createdAt or updatedAt column does not prove publication to learners.
 * Reordered project-level audit events and legacy rows do not prove sharing.
 */
export type MentorResourceProvenanceEvent={
 resourceId:string;eventType:string;metadata:Record<string,unknown>;
 occurredAt:Date;userId:string|null;displayName:string|null;
};
export type MentorResourceShareProvenance={
 resourceId:string;userId:string|null;displayName:string|null;sharedAt:string|null;
};
const asObject=(value:unknown):Record<string,unknown>|null=>
 value!==null&&typeof value==="object"&&!Array.isArray(value)
   ?value as Record<string,unknown>:null;
const teamActive=(x:Record<string,unknown>|null)=>
 x?.["status"]==="ACTIVE"&&x["visibility"]==="TEAM";
/** The first audited transition INTO ACTIVE + TEAM is the initial share.
 * An update that merely changes a title is NOT a new share.
 */
export function deriveMentorResourceShareProvenance(
 events:readonly MentorResourceProvenanceEvent[],projectId:string,
):MentorResourceShareProvenance[]{
 const byResource=new Map<string,MentorResourceShareProvenance>();
 const ordered=[...events].sort((a,b)=>
   a.occurredAt.getTime()-b.occurredAt.getTime()||
   a.resourceId.localeCompare(b.resourceId));
 for(const event of ordered){
   if(event.metadata["projectId"]!==projectId||
      !Number.isFinite(event.occurredAt.getTime()))continue;
   let found=byResource.get(event.resourceId);
   if(!found){
     found={resourceId:event.resourceId,userId:null,displayName:null,sharedAt:null};
     byResource.set(event.resourceId,found);
   }
   const isCreate=event.eventType==="projects.resource.created";
   const isUpdate=event.eventType==="projects.resource.updated";
   if(isCreate&&found.userId===null){
     found.userId=event.userId;
     found.displayName=event.displayName;
   }
   const after=asObject(event.metadata["afterJson"]);
   const before=asObject(event.metadata["beforeJson"]);
   // Updates require *both* trustworthy versioned snapshots to disambiguate
   // a first publication from a regular edit. Old events stay UNKNOWN.
   const published=isCreate?teamActive(after):
     isUpdate&&before!==null&&after!==null&&teamActive(after)&&!teamActive(before);
   if(published&&found.sharedAt===null)
     found.sharedAt=event.occurredAt.toISOString();
 }
 return [...byResource.values()];
}
