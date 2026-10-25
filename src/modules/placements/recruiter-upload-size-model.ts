export class RecruiterUploadTooLargeError extends Error{
 constructor(){super("FILE_TOO_LARGE");this.name="RecruiterUploadTooLargeError";}
}
/** The envelope (not only the extracted file) is bounded before the multipart
 * parser allocates memory. Applies even to chunked/no Content-Length uploads. */
export async function readRecruiterUploadEnvelope(request:Request,maxBytes=300000):
 Promise<Uint8Array>{
 if(!request.body)return new Uint8Array();
 const reader=request.body.getReader();
 const parts:Uint8Array[]=[];let total=0;
 try{
  for(;;){
   const next=await reader.read();
   if(next.done)break;
   total+=next.value.byteLength;
   if(total>maxBytes){
    await reader.cancel().catch(()=>{});
    throw new RecruiterUploadTooLargeError();
   }
   parts.push(next.value);
  }
  const bytes=new Uint8Array(total);
  let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
  return bytes;
 }finally{reader.releaseLock();}
}
