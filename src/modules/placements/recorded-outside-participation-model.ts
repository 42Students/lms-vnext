import {z} from "zod";
export const recordedOutsideParticipantSchema=z.strictObject({
 recordId:z.string().uuid(),membershipId:z.string().uuid(),
 result:z.enum(["PARTICIPATED","PASSED","FAILED","SELECTED","HIRED"]),
 notes:z.string().trim().max(500).optional(),
});
export function outsideDriveResultLabel(value:string):string{
 return value==="PARTICIPATED"?"Participated":value==="PASSED"?"Passed":
 value==="FAILED"?"Did not pass":value==="SELECTED"?"Selected (outside platform)":
 value==="HIRED"?"Hired (external record)":"Not recorded";
}
