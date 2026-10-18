/** Company Team commands are small text and UUIDs; file uploads have separate routes. */
export const TPO_COMPANY_TEAM_MAX_BODY_BYTES=16*1024;

export class TpoCompanyTeamBodyError extends Error {
 constructor(
  readonly code:"INVALID_TEAM_JSON"|"UNSUPPORTED_TEAM_CONTENT_TYPE"|"TEAM_BODY_TOO_LARGE",
  readonly status:400|413|415,
 ){
  super(code);
  this.name="TpoCompanyTeamBodyError";
 }
}

/** Reject oversized or malformed JSON before allocating an unbounded Request.json body. */
export async function readTpoCompanyTeamBody(request:Request):Promise<unknown> {
 const mime=request.headers.get("content-type")?.split(";",1)[0]?.trim().toLowerCase();
 if(mime!=="application/json"&&
   !(mime?.startsWith("application/")&&mime.endsWith("+json")))
  throw new TpoCompanyTeamBodyError("UNSUPPORTED_TEAM_CONTENT_TYPE",415);
 const declared=request.headers.get("content-length");
 if(declared!==null){
  const amount=Number(declared);
  if(!/^\d+$/.test(declared)||!Number.isSafeInteger(amount))
   throw new TpoCompanyTeamBodyError("INVALID_TEAM_JSON",400);
  if(amount>TPO_COMPANY_TEAM_MAX_BODY_BYTES)
   throw new TpoCompanyTeamBodyError("TEAM_BODY_TOO_LARGE",413);
 }
 if(!request.body)throw new TpoCompanyTeamBodyError("INVALID_TEAM_JSON",400);
 const reader=request.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let bytes=0,text="";
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   bytes+=value.byteLength;
   if(bytes>TPO_COMPANY_TEAM_MAX_BODY_BYTES)
    throw new TpoCompanyTeamBodyError("TEAM_BODY_TOO_LARGE",413);
   text+=decoder.decode(value,{stream:true});
  }
  text+=decoder.decode();
 }catch(error){
  if(error instanceof TpoCompanyTeamBodyError)throw error;
  throw new TpoCompanyTeamBodyError("INVALID_TEAM_JSON",400);
 }finally{reader.releaseLock();}
 try{return JSON.parse(text) as unknown;}
 catch{throw new TpoCompanyTeamBodyError("INVALID_TEAM_JSON",400);}
}
