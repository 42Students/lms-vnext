/** Small JSON body reader for a Super Admin college sign-in policy switch.
 * This endpoint has a three-field payload and must reject oversized streams,
 * even when a client omits Content-Length. */
export class AdminSignInRequestError extends Error {
 constructor(readonly code:"BODY_TOO_LARGE"|"INVALID_JSON"){
  super(code);this.name="AdminSignInRequestError";
 }
}

export async function readAdminSignInRequestBody(request:Request):Promise<unknown>{
 const contentType=request.headers.get("content-type")??"";
 if(!/^application\/json(?:\s*;|\s*$)/i.test(contentType))
  throw new AdminSignInRequestError("INVALID_JSON");
 const length=request.headers.get("content-length");
 if(length!==null){
  if(!/^[0-9]+$/.test(length))throw new AdminSignInRequestError("INVALID_JSON");
  if(Number(length)>2048)throw new AdminSignInRequestError("BODY_TOO_LARGE");
 }
 if(!request.body)throw new AdminSignInRequestError("INVALID_JSON");
 const reader=request.body.getReader();
 const chunks:Uint8Array[]=[];
 let size=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>2048){
    await reader.cancel();
    throw new AdminSignInRequestError("BODY_TOO_LARGE");
   }
   chunks.push(value);
  }
 }catch(error){
  if(error instanceof AdminSignInRequestError)throw error;
  throw new AdminSignInRequestError("INVALID_JSON");
 }finally{
  reader.releaseLock();
 }
 if(size===0)throw new AdminSignInRequestError("INVALID_JSON");
 const bytes=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 try{return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;}
 catch{throw new AdminSignInRequestError("INVALID_JSON");}
}
