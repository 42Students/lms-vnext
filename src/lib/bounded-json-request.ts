/** Shared no-buffer-overflow JSON reader for sensitive mutation routes.
 * Enforces actual streamed UTF-8 bytes, not untrusted Content-Length alone. */
export async function readBoundedJsonRequest(
  request:Request,
  maxBytes:number,
):Promise<{ok:true;value:unknown}|{ok:false}>{
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1)return {ok:false};
  const declared=request.headers.get("content-length");
  if(declared!==null){
    if(!/^(?:0|[1-9][0-9]*)$/.test(declared) ||
      Number(declared)>maxBytes)return {ok:false};
  }
  if(!request.body)return {ok:false};
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let bytes=0;
  let text="";
  try{
    while(true){
      const chunk=await reader.read();
      if(chunk.done)break;
      bytes+=chunk.value.byteLength;
      if(bytes>maxBytes){
        await reader.cancel();
        return {ok:false};
      }
      text+=decoder.decode(chunk.value,{stream:true});
    }
    text+=decoder.decode();
    return {ok:true,value:JSON.parse(text) as unknown};
  }catch{
    return {ok:false};
  }finally{
    reader.releaseLock();
  }
}
