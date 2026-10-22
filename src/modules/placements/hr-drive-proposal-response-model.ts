export type HrDriveProposalResponse={
 threadId:string;messageId:string;replayed:boolean;
};
/** Reject a false-positive response before navigating away from an unsent draft. */
export function isHrDriveProposalResponse(raw:unknown):raw is HrDriveProposalResponse{
 if(raw===null||typeof raw!=="object")return false;
 const value=raw as Record<string,unknown>;
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 return typeof value["threadId"]==="string"&&uuid.test(value["threadId"])&&
  typeof value["messageId"]==="string"&&uuid.test(value["messageId"])&&
  typeof value["replayed"]==="boolean";
}
