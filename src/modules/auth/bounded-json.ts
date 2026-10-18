/** Unauthenticated OTP endpoints must never buffer arbitrarily large JSON bodies.
 * A missing or forged Content-Length does not bypass the streaming byte cap.
 */
export const MAX_AUTH_JSON_BYTES=8_192;

export class AuthRequestBodyTooLarge extends Error {
 constructor(){super("AUTH_REQUEST_BODY_TOO_LARGE");this.name="AuthRequestBodyTooLarge";}
}

export async function readBoundedAuthJson(
 request:Request,maxBytes=MAX_AUTH_JSON_BYTES,
):Promise<unknown>{
 const reported=request.headers.get("content-length");
 if(reported!==null&&Number.isFinite(Number(reported))&&Number(reported)>maxBytes)
  throw new AuthRequestBodyTooLarge();
 if(!request.body)throw new SyntaxError("Missing JSON request body");
 const reader=request.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let bytes=0;
 let text="";
 try{
  for(;;){
   const result=await reader.read();
   if(result.done)break;
   bytes+=result.value.byteLength;
   if(bytes>maxBytes)throw new AuthRequestBodyTooLarge();
   text+=decoder.decode(result.value,{stream:true});
  }
  text+=decoder.decode();
  return JSON.parse(text) as unknown;
 }finally{
  try{await reader.cancel();}catch{/* body already consumed */ }
  reader.releaseLock();
 }
}
