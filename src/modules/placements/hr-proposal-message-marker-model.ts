import {previewHrDriveProposalMessage} from "./hr-drive-proposal-history-model";
export function recruiterProposalMessageMarker(senderType:string,body:string){
 return senderType==="RECRUITER"?previewHrDriveProposalMessage(body):null;
}
