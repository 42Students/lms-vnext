const MAX_BRANDING_JSON_BYTES=16*1024;

export class CollegeBrandingBodyError extends Error {
 constructor(readonly code:"INVALID_JSON"|"BODY_TOO_LARGE"){
  super(code);this.name="CollegeBrandingBodyError";
 }
}

/** A body cap that also applies when Content-Length is absent. */
export async function readCollegeBrandingBody(request:Request):Promise<unknown>{
 const type=request.headers.get("content-type")??"";
 if(!/^application\/json(?:\s*;|\s*$)/i.test(type))
  throw new CollegeBrandingBodyError("INVALID_JSON");
 const length=request.headers.get("content-length");
 if(length!==null){
  if(!/^\d+$/.test(length))throw new CollegeBrandingBodyError("INVALID_JSON");
  if(Number(length)>MAX_BRANDING_JSON_BYTES)
   throw new CollegeBrandingBodyError("BODY_TOO_LARGE");
 }
 if(!request.body)throw new CollegeBrandingBodyError("INVALID_JSON");
 const reader=request.body.getReader();
 const chunks:Uint8Array[]=[];
 let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_BRANDING_JSON_BYTES){
    await reader.cancel();
    throw new CollegeBrandingBodyError("BODY_TOO_LARGE");
   }
   chunks.push(value);
  }
 }catch(error){
  if(error instanceof CollegeBrandingBodyError)throw error;
  throw new CollegeBrandingBodyError("INVALID_JSON");
 }finally{
  reader.releaseLock();
 }
 if(size===0)throw new CollegeBrandingBodyError("INVALID_JSON");
 const bytes=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){
  bytes.set(chunk,offset);offset+=chunk.byteLength;
 }
 try{
  return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;
 }catch{
  throw new CollegeBrandingBodyError("INVALID_JSON");
 }
}
