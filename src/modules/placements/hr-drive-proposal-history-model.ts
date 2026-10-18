import {z} from "zod";
export const hrDriveProposalHistoryQuerySchema=z.strictObject({
 collegeId:z.string().uuid().optional(),
 page:z.union([z.number().int(),z.string().regex(/^[1-9][0-9]*$/).transform(Number)])
  .pipe(z.number().int().min(1).max(10000)).default(1),
 q:z.string().trim().max(100).default(""),
 sort:z.enum(["LATEST","OLDEST"]).default("LATEST"),
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

export const HR_PROPOSAL_PAGE_SIZE=20;
export function hrProposalHistoryWindow(requestedPage:number,total:number){
 if(!Number.isSafeInteger(total)||total<0)throw new Error("INVALID_PROPOSAL_COUNT");
 const pages=Math.max(1,Math.ceil(total/HR_PROPOSAL_PAGE_SIZE));
 const page=Number.isSafeInteger(requestedPage)
  ?Math.max(1,Math.min(requestedPage,pages)):1;
 return {page,pages,offset:(page-1)*HR_PROPOSAL_PAGE_SIZE,total};
}
