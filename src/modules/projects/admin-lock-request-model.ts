/** Read an admin lock command without buffering an unbounded request body.
 * Validation of the command shape and permissions still belongs to the
 * transactional lock service. An invalid body never reaches that service. */
export async function readLimitedProjectLockInput(
  request:Request,
  maxBytes=8192,
):Promise<{ok:true;value:unknown}|{ok:false}>{
  const header=request.headers.get("content-length");
  if(header!==null){
    const length=Number(header);
    if(!Number.isSafeInteger(length)||length<0||length>maxBytes)
      return {ok:false};
  }
  if(!request.body)return {ok:false};
  const reader=request.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let bytes=0;
  let body="";
  try{
    while(true){
      const chunk=await reader.read();
      if(chunk.done)break;
      bytes+=chunk.value.byteLength;
      if(bytes>maxBytes){
        await reader.cancel();
        return {ok:false};
      }
      body+=decoder.decode(chunk.value,{stream:true});
    }
    body+=decoder.decode();
    return {ok:true,value:JSON.parse(body) as unknown};
  }catch{
    return {ok:false};
  }finally{
    reader.releaseLock();
  }
}
