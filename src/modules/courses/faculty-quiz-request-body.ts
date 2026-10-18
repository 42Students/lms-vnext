/** A bounded request parser for Faculty Quiz authoring; Zod still validates command fields. */
export const FACULTY_QUIZ_COMMAND_LIMIT_BYTES=16*1024*1024;
export class FacultyQuizBodyError extends Error {
 constructor(public readonly code:"FACULTY_QUIZ_BODY_TOO_LARGE"|"INVALID_QUIZ_JSON"|"UNSUPPORTED_QUIZ_CONTENT_TYPE",public readonly status:400|413|415){
  super(code);
 }
}
export function facultyQuizAcceptsContentType(raw:string|null):boolean {
 if(raw===null)return false;
 const mediaType=raw.split(";",1)[0]?.trim().toLowerCase();
 return mediaType==="application/json"||Boolean(mediaType?.startsWith("application/")&&mediaType.endsWith("+json"));
}
export async function readFacultyQuizCommandBody(request:Request):Promise<unknown>{
 if(!facultyQuizAcceptsContentType(request.headers.get("content-type")))
  throw new FacultyQuizBodyError("UNSUPPORTED_QUIZ_CONTENT_TYPE",415);
 const declared=request.headers.get("content-length");
 if(declared!==null){
  const size=Number(declared);
  // Treat invalid or ambiguous Content-Length as malformed transport rather
  // than silently ignoring it and risking inconsistent proxy/body framing.
  if(!/^\\d+$/.test(declared)||!Number.isSafeInteger(size))
   throw new FacultyQuizBodyError("INVALID_QUIZ_JSON",400);
  if(size>FACULTY_QUIZ_COMMAND_LIMIT_BYTES)
   throw new FacultyQuizBodyError("FACULTY_QUIZ_BODY_TOO_LARGE",413);
 }
 if(!request.body)throw new FacultyQuizBodyError("INVALID_QUIZ_JSON",400);
 const reader=request.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let total=0;
 let body="";
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>FACULTY_QUIZ_COMMAND_LIMIT_BYTES)
    throw new FacultyQuizBodyError("FACULTY_QUIZ_BODY_TOO_LARGE",413);
   body+=decoder.decode(value,{stream:true});
  }
  body+=decoder.decode();
 }catch(error){
  if(error instanceof FacultyQuizBodyError)throw error;
  throw new FacultyQuizBodyError("INVALID_QUIZ_JSON",400);
 }finally{
  reader.releaseLock();
 }
 try{return JSON.parse(body) as unknown;}
 catch{throw new FacultyQuizBodyError("INVALID_QUIZ_JSON",400);}
}
