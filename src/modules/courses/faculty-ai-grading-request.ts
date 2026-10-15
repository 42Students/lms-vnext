import {z} from "zod";
import {aiGradingSelectionSchema,aiGradingRubricSchema} from "./faculty-ai-grading-model";
export const facultyAiGradingRequestSchema=z.object({
 selection:aiGradingSelectionSchema.extend({submissionId:z.string().uuid()}),
 expectedSubmissionVersion:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
 rubric:aiGradingRubricSchema,
}).strict();
export type FacultyAiGradingRequest=z.infer<typeof facultyAiGradingRequestSchema>;
export class FacultyAiGradingBodyTooLarge extends Error {
 constructor(){super("AI_GRADING_REQUEST_TOO_LARGE");}
}
export class FacultyAiGradingBadMediaType extends Error {
 constructor(){super("AI_GRADING_JSON_REQUIRED");}
}
export const AI_GRADING_BODY_LIMIT=65536;
export async function readFacultyAiGradingJson(request:Request):Promise<unknown>{
 const contentType=request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
 if(contentType!=="application/json")throw new FacultyAiGradingBadMediaType();
 const declared=request.headers.get("content-length");
 if(declared && Number(declared)>AI_GRADING_BODY_LIMIT)throw new FacultyAiGradingBodyTooLarge();
 const reader=request.body?.getReader();
 if(!reader)throw new Error("AI_GRADING_EMPTY_REQUEST");
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){
  const result=await reader.read();
  if(result.done)break;
  size+=result.value.byteLength;
  if(size>AI_GRADING_BODY_LIMIT){
   await reader.cancel();throw new FacultyAiGradingBodyTooLarge();
  }
  chunks.push(result.value);
 }
 const bytes=new Uint8Array(size);
 let index=0;for(const chunk of chunks){bytes.set(chunk,index);index+=chunk.byteLength;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;
}
