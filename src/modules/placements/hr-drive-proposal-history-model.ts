import {z} from "zod";
export const hrDriveProposalHistoryQuerySchema=z.strictObject({
 collegeId:z.string().uuid().optional(),
});
export type HrDriveProposalPreview={referenceId:string;title:string};
/** Deliberately projects the proposal header, not the private description/body. */
export function previewHrDriveProposalMessage(body:string):HrDriveProposalPreview|null{
 const lines=body.split(/\r?\n/,4);
 if(lines[0]!=="Drive proposal for placement cell discussion — NOT a submitted approval request")return null;
 const id=lines[1]?.startsWith("Proposal reference: ")?
  lines[1].slice("Proposal reference: ".length):"";
 const title=lines[2]?.startsWith("Role: ")?lines[2].slice("Role: ".length).trim():"";
 if(!z.string().uuid().safeParse(id).success||!title||title.length>200)return null;
 return {referenceId:id,title};
}
