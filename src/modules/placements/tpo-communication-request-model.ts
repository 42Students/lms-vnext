/** Bound the settings JSON request before parsing so an absent Content-Length
 * cannot bypass the per-request memory cap. The five settings sections need
 * well below this limit even with Unicode signature text. */
const MAX_SETTINGS_BODY_BYTES=8192;

export class TpoCommunicationBodyError extends Error{
 constructor(readonly code:"BODY_TOO_LARGE"|"INVALID_JSON"){
  super(code);this.name="TpoCommunicationBodyError";
 }
}

export async function readTpoCommunicationBody(request:Request):Promise<unknown>{
 const contentType=request.headers.get("content-type")??"";
 if(!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
  throw new TpoCommunicationBodyError("INVALID_JSON");
 const length=request.headers.get("content-length");
 if(length!==null){
  if(!/^[0-9]+$/.test(length))throw new TpoCommunicationBodyError("INVALID_JSON");
  if(Number(length)>MAX_SETTINGS_BODY_BYTES)throw new TpoCommunicationBodyError("BODY_TOO_LARGE");
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
   if(total>MAX_SETTINGS_BODY_BYTES){
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
