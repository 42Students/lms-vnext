import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const recordedOutsideParticipantSchema=z.strictObject({
 recordId:zUuid,membershipId:zUuid,
 result:z.enum(["PARTICIPATED","PASSED","FAILED","SELECTED","HIRED"]),
 notes:z.string().trim().max(500).optional(),
});
export function outsideDriveResultLabel(value:string):string{
 return value==="PARTICIPATED"?"Participated":value==="PASSED"?"Passed":
 value==="FAILED"?"Did not pass":value==="SELECTED"?"Selected (outside platform)":
 value==="HIRED"?"Hired (external record)":"Not recorded";
}
