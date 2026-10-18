import {ZodError} from "zod";

const MAX_RESOURCE_COMMAND_BYTES=16_384;
function invalid(message:string):never{
 throw new ZodError([{code:"custom",path:[],message}]);
}

/** Bounded input at the HTTP boundary, before parsing untrusted JSON.
 * A material link/notes command fits well under this limit; body size is
 * measured in actual UTF-8 bytes, not trusting a caller's Content-Length. */
export async function readResourceMaterialCommandJson(request:Request):Promise<unknown>{
 const length=request.headers.get("content-length");
 if(length && (!/^\d+$/.test(length)||Number(length)>MAX_RESOURCE_COMMAND_BYTES))
  invalid("Resource material request is too large");
 const reader=request.body?.getReader();
 if(!reader)invalid("Resource material request must be a JSON object");
 const chunks:Uint8Array[]=[];
 let size=0;
 while(true){
  const {done,value}=await reader.read();
  if(done)break;
  size+=value.byteLength;
  if(size>MAX_RESOURCE_COMMAND_BYTES){
   await reader.cancel();
   invalid("Resource material request is too large");
  }
  chunks.push(value);
 }
 const payload=new Uint8Array(size);
 let offset=0;
 for(const chunk of chunks){payload.set(chunk,offset);offset+=chunk.byteLength;}
 let parsed:unknown;
 try{
  parsed=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(payload));
 }catch{
  invalid("Resource material request must be valid JSON");
 }
 if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))
  invalid("Resource material request must be a JSON object");
 return parsed;
}
