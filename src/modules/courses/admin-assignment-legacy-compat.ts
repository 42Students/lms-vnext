import {z} from "zod";
import {parseCollegeIstLocal} from "./college-ist-datetime-model";

/** Explicit v1-to-vNext adapter; numeric historical IDs are import-only.
 * Opaque embedded resource JSON must be imported separately with verified
 * uploads, never dropped after an ostensibly successful save. */
export const legacyAssignmentWriteSchema=z.strictObject({
 contentType:z.literal("ASSIGNMENT"),
 lessonId:z.string().uuid(),
 courseId:z.string().uuid().optional(),
 contentTitle:z.string().trim().min(1).max(255),
 points:z.number().int().min(0).max(10000).default(0),
 sequence:z.number().int().min(0).max(10000).default(0),
 audience:z.enum(["ALL","SECTION"]).default("ALL"),
 deliveryId:z.string().uuid().nullable().optional(),
 deadline:z.string().nullable().optional(),
 instructions:z.string().max(10000).nullable().optional(),
 methods:z.array(z.enum(["WRITTEN_RESPONSE","PDF_UPLOAD","FILE_UPLOAD","REPOSITORY_LINK","EXTERNAL_LINK"]))
  .min(1).max(5).default(["WRITTEN_RESPONSE"]),
 contentDataDTO:z.unknown().nullable().optional(),
}).superRefine((value,ctx)=>{
 if(value.audience==="SECTION"&&!value.deliveryId)
  ctx.addIssue({code:"custom",path:["deliveryId"],message:"Select a section"});
 if(value.deadline&&parseCollegeIstLocal(value.deadline.replace(" ","T").slice(0,16))===null)
  ctx.addIssue({code:"custom",path:["deadline"],message:"Enter a valid IST deadline"});
 if(value.contentDataDTO!==undefined&&value.contentDataDTO!==null&&
    !(typeof value.contentDataDTO==="object"&&
      !Array.isArray(value.contentDataDTO)&&
      Object.keys(value.contentDataDTO).length===0))
  ctx.addIssue({code:"custom",path:["contentDataDTO"],message:"Resources require verified uploads in the assignment editor. No embedded files were discarded."});
});
export function toModernAssignmentWrite(raw:unknown){
 const input=legacyAssignmentWriteSchema.parse(raw);
 return {
  lessonId:input.lessonId,deliveryId:input.audience==="SECTION"?input.deliveryId:null,
  title:input.contentTitle,description:input.instructions??null,maxPoints:input.points,
  sequence:input.sequence,allowedMethods:input.methods,
  dueAt:input.deadline?parseCollegeIstLocal(input.deadline.replace(" ","T").slice(0,16)):null,
 };
}
