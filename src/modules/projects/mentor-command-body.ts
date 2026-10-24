/** Bounded, strict-UTF8 JSON reader for Faculty/Mentor project write routes.
 * Service Zod schemas still authorize every field, state and version token. */
export const MENTOR_PROJECT_COMMAND_LIMIT_BYTES=128*1024;
export type MentorProjectCommandBodyCode=
  "INVALID_PROJECT_COMMAND_BODY"|"PROJECT_COMMAND_BODY_TOO_LARGE"|
  "UNSUPPORTED_PROJECT_COMMAND_CONTENT_TYPE";
export class MentorProjectCommandBodyError extends Error {
 constructor(
  public readonly code:MentorProjectCommandBodyCode,
  public readonly status:400|413|415,
 ) {
  super(code);
  this.name="MentorProjectCommandBodyError";
 }
}
export function mentorProjectCommandContentType(raw:string|null):boolean{
 if(raw===null)return false;
 const media=raw.split(";",1)[0]?.trim().toLowerCase();
 return media==="application/json"||
  Boolean(media?.startsWith("application/")&&media.endsWith("+json"));
}
export async function readMentorProjectCommandBody(
 request:Request,maxBytes:number=MENTOR_PROJECT_COMMAND_LIMIT_BYTES,
):Promise<unknown>{
 if(!mentorProjectCommandContentType(request.headers.get("content-type")))
  throw new MentorProjectCommandBodyError("UNSUPPORTED_PROJECT_COMMAND_CONTENT_TYPE",415);
 const declared=request.headers.get("content-length");
 if(declared!==null){
  const size=Number(declared);
  if(!Number.isSafeInteger(size)||size<0)
   throw new MentorProjectCommandBodyError("INVALID_PROJECT_COMMAND_BODY",400);
  if(size>maxBytes)
   throw new MentorProjectCommandBodyError("PROJECT_COMMAND_BODY_TOO_LARGE",413);
 }
 if(!request.body)
  throw new MentorProjectCommandBodyError("INVALID_PROJECT_COMMAND_BODY",400);
 const decoder=new TextDecoder("utf-8",{fatal:true});
 const reader=request.body.getReader();
 let bytes=0,text="";
 try{
  while(true){
   const {value,done}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>maxBytes)
    throw new MentorProjectCommandBodyError("PROJECT_COMMAND_BODY_TOO_LARGE",413);
   text+=decoder.decode(value,{stream:true});
  }
  text+=decoder.decode();
 }catch(error){
  try{await reader.cancel();}catch{/* Stream may already be closed. */}
  if(error instanceof MentorProjectCommandBodyError)throw error;
  throw new MentorProjectCommandBodyError("INVALID_PROJECT_COMMAND_BODY",400);
 }finally{
  reader.releaseLock();
 }
 try{return JSON.parse(text) as unknown;}
 catch{throw new MentorProjectCommandBodyError("INVALID_PROJECT_COMMAND_BODY",400);}
}
export function mentorProjectBodyFailureMessage(status:400|413|415):string{
 if(status===413)return "This update is too large. Shorten the notes and retry.";
 if(status===415)return "This update must be sent as JSON. Refresh and retry.";
 return "The update could not be read. Check the form and retry.";
}
