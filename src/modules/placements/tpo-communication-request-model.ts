/** Bound the settings JSON request before parsing so an absent Content-Length
 * cannot bypass the per-request memory cap. The five settings sections need
 * well below this limit even with Unicode signature text. */
const MAX_SETTINGS_BODY_BYTES=8192;
const MAX_CAMPAIGN_BODY_BYTES=65536;

export class TpoCommunicationBodyError extends Error{
 constructor(readonly code:"BODY_TOO_LARGE"|"INVALID_JSON"){
  super(code);this.name="TpoCommunicationBodyError";
 }
}

export async function readTpoCommunicationBody(request:Request,maxBytes:8192|65536=MAX_SETTINGS_BODY_BYTES):Promise<unknown>{
 const contentType=request.headers.get("content-type")??"";
 if(!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
  throw new TpoCommunicationBodyError("INVALID_JSON");
 const length=request.headers.get("content-length");
 if(length!==null){
  if(!/^[0-9]+$/.test(length))throw new TpoCommunicationBodyError("INVALID_JSON");
  if(Number(length)>maxBytes)throw new TpoCommunicationBodyError("BODY_TOO_LARGE");
 }
 if(!request.body)throw new TpoCommunicationBodyError("INVALID_JSON");
 const reader=request.body.getReader();
 let total=0;
 const chunks:Uint8Array[]=[];
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>maxBytes){
    await reader.cancel();
    throw new TpoCommunicationBodyError("BODY_TOO_LARGE");
   }
   chunks.push(value);
  }
 }catch(error){
  if(error instanceof TpoCommunicationBodyError)throw error;
  throw new TpoCommunicationBodyError("INVALID_JSON");
 }finally{
  reader.releaseLock();
 }
 if(total===0)throw new TpoCommunicationBodyError("INVALID_JSON");
 const bytes=new Uint8Array(total);
 let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;
 }catch{
  throw new TpoCommunicationBodyError("INVALID_JSON");
 }
}

/** Shared settings request boundary, including personal preferences and college policies. */
export const readTpoSettingsBody=readTpoCommunicationBody;
/** The authored campaign body allows 10,000 characters; UTF-8 payloads may
 * exceed the tighter settings cap, but are still strictly stream-bounded. */
export const readTpoCampaignBody=(request:Request)=>readTpoCommunicationBody(request,MAX_CAMPAIGN_BODY_BYTES);
