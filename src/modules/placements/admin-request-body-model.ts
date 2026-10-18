/** Bound the actual bytes of Super Admin placement writes before parsing.
 * Content-Length is only an early hint; a streamed body can lie about it. */
export async function readAdminPlacementJson(
  request:Request,
  maxBytes:number,
):Promise<{ok:true;value:unknown}|{ok:false}>{
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1)return {ok:false};
  const advertised=request.headers.get("content-length");
  if(advertised!==null){
    if(!/^(?:0|[1-9][0-9]*)$/.test(advertised) ||
       Number(advertised)>maxBytes)return {ok:false};
  }
  if(!request.body)return {ok:false};
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let length=0;
  let text="";
  try{
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>maxBytes){
        await reader.cancel();
        return {ok:false};
      }
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
    return {ok:true,value:JSON.parse(text) as unknown};
  }catch{
    return {ok:false};
  }finally{
    reader.releaseLock();
  }
}
