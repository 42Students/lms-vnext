/** Read the signed webhook bytes with a hard cap before allocating a full body.
 * A Content-Length header is untrusted: enforce the limit on stream chunks.
 * Decode only valid UTF-8, so the HMAC always covers canonical source bytes.
 */
export async function readBoundedRecruiterInboundBody(
 request:Request,
 maxBytes=20_000,
):Promise<{kind:"OK";body:string}|{kind:"TOO_LARGE"}|{kind:"INVALID_UTF8"}>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<0)
  throw new Error("INVALID_INBOUND_LIMIT");
 if(!request.body)return {kind:"OK",body:""};
 const reader=request.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true});
 let total=0;
 let body="";
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>maxBytes){
    await reader.cancel().catch(()=>undefined);
    return {kind:"TOO_LARGE"};
   }
   body+=decoder.decode(value,{stream:true});
  }
  body+=decoder.decode();
  return {kind:"OK",body};
 }catch{
  await reader.cancel().catch(()=>undefined);
  return {kind:"INVALID_UTF8"};
 }finally{
  reader.releaseLock();
 }
}
