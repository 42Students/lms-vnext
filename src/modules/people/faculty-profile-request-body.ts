export class FacultyProfileBodyTooLarge extends Error {}
export const FACULTY_PROFILE_MAX_REQUEST_BYTES=1_048_576;

/** Count streamed bytes before JSON.parse, including requests without Content-Length. */
export async function readBoundedFacultyProfileJson(request:Request):Promise<unknown>{
 const declared=request.headers.get("content-length");
 if(declared!==null && Number.isFinite(Number(declared)) &&
    Number(declared)>FACULTY_PROFILE_MAX_REQUEST_BYTES)throw new FacultyProfileBodyTooLarge();
 const reader=request.body?.getReader();
 if(!reader)throw new Error("Empty request");
 let size=0;const chunks:Uint8Array[]=[];
 for(;;){
  const {done,value}=await reader.read();
  if(done)break;
  size+=value.byteLength;
  if(size>FACULTY_PROFILE_MAX_REQUEST_BYTES){
   await reader.cancel();
   throw new FacultyProfileBodyTooLarge();
  }
  chunks.push(value);
 }
 const joined=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(joined)) as unknown;
}
