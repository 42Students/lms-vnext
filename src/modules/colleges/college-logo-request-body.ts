/** Bound multipart logo uploads before invoking Request.formData(). */
const MAX_MULTIPART_BYTES=3*1024*1024;

export class CollegeLogoRequestError extends Error {
 constructor(readonly code:"INVALID_REQUEST"|"LOGO_TOO_LARGE") {
  super(code);
  this.name="CollegeLogoRequestError";
 }
}

export async function readCollegeLogoForm(request:Request):Promise<FormData>{
 const type=request.headers.get("content-type")??"";
 if(!/^multipart\/form-data\s*;\s*boundary=[^;\s]{1,200}(?:\s*)$/i.test(type))
  throw new CollegeLogoRequestError("INVALID_REQUEST");
 const length=request.headers.get("content-length");
 if(length!==null){
  if(!/^\d+$/.test(length))throw new CollegeLogoRequestError("INVALID_REQUEST");
  if(Number(length)>MAX_MULTIPART_BYTES)throw new CollegeLogoRequestError("LOGO_TOO_LARGE");
 }
 if(!request.body)throw new CollegeLogoRequestError("INVALID_REQUEST");
 const reader=request.body.getReader();
 let size=0;
 const chunks:Uint8Array[]=[];
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_MULTIPART_BYTES){
    await reader.cancel();
    throw new CollegeLogoRequestError("LOGO_TOO_LARGE");
   }
   chunks.push(value);
  }
 }catch(error){
  if(error instanceof CollegeLogoRequestError)throw error;
  throw new CollegeLogoRequestError("INVALID_REQUEST");
 }finally{
  reader.releaseLock();
 }
 if(size===0)throw new CollegeLogoRequestError("INVALID_REQUEST");
 const bytes=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){
  bytes.set(chunk,offset);
  offset+=chunk.byteLength;
 }
 try{
  return await new Response(bytes,{headers:{"content-type":type}}).formData();
 }catch{
  throw new CollegeLogoRequestError("INVALID_REQUEST");
 }
}
