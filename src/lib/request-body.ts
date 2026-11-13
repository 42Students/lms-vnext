/**
 * Every way the app reads an untrusted request body, in one module. All of them count the bytes as they stream in (never
 * trusting Content-Length alone) and refuse oversized or non-UTF-8 input before parsing. Four call shapes exist because
 * routes historically wanted different failure styles; they share one byte reader:
 *   readBoundedUtf8Body     raw text, discriminated result
 *   readBoundedJsonBody     parsed JSON, discriminated result (used by the route wrapper)
 *   readBoundedJsonRequest  parsed JSON, ok/not-ok (sensitive mutations; also checks Content-Length first)
 *   boundedRequestJson      parsed JSON, throws RequestBodyError (drop-in for request.json())
 *   readBoundedAuthJson     parsed JSON for unauthenticated sign-in endpoints, throws AuthRequestBodyTooLarge
 */
/** Read untrusted request bytes with a hard cap before allocating a full body.
 * A Content-Length header is untrusted: enforce the limit on stream chunks.
 * Decode only valid UTF-8, so the HMAC always covers canonical source bytes.
 */
export async function readBoundedUtf8Body(
 request:Request,
 maxBytes=20_000,
):Promise<{kind:"OK";body:string}|{kind:"TOO_LARGE"}|{kind:"INVALID_UTF8"}>{
 if(!Number.isSafeInteger(maxBytes)||maxBytes<0)
  throw new Error("INVALID_INBOUND_LIMIT");
 if(!request.body)return {kind:"OK",body:""};
 const reader=request.body.getReader();
 const decoder=new TextDecoder("utf-8",{fatal:true,ignoreBOM:true});
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

/** Public JSON forms are small. Parse only after a strict UTF-8 byte cap.
 * Never echo parser details, untrusted input or credentials in responses.
 */
export async function readBoundedJsonBody(
 request:Request,maxBytes=8192,
):Promise<{kind:"OK";value:unknown}|{kind:"INVALID"}|{kind:"TOO_LARGE"}>{
 const body=await readBoundedUtf8Body(request,maxBytes);
 if(body.kind==="TOO_LARGE")return {kind:"TOO_LARGE"};
 if(body.kind!=="OK")return {kind:"INVALID"};
 try{return {kind:"OK",value:JSON.parse(body.body) as unknown};}
 catch{return {kind:"INVALID"};}
}

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

/** A request body the caller got wrong: unreadable, not JSON, or over the size cap. `apiErrorResponse` maps it to 400/413. */
export class RequestBodyError extends Error {
  readonly status: 400 | 413;
  readonly code: "INVALID_REQUEST" | "REQUEST_TOO_LARGE";
  constructor(kind: "INVALID" | "TOO_LARGE") {
    super(kind === "TOO_LARGE" ? "Request body is too large." : "Request body is not valid JSON.");
    this.name = "RequestBodyError";
    this.status = kind === "TOO_LARGE" ? 413 : 400;
    this.code = kind === "TOO_LARGE" ? "REQUEST_TOO_LARGE" : "INVALID_REQUEST";
  }
}

export const DEFAULT_JSON_BODY_BYTES = 2 * 1024 * 1024;

/**
 * Drop-in replacement for `await request.json()`: the same result for a valid body, but the bytes are counted while
 * they stream in, so an oversized body is refused before it is held in memory. Throws `RequestBodyError`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mirrors Request.json(), which callers validate themselves
export async function boundedRequestJson(request: Request, maxBytes = DEFAULT_JSON_BODY_BYTES): Promise<any> {
  const body = await readBoundedUtf8Body(request, maxBytes);
  if (body.kind === "TOO_LARGE") throw new RequestBodyError("TOO_LARGE");
  if (body.kind !== "OK") throw new RequestBodyError("INVALID");
  try {
    return JSON.parse(body.body);
  } catch {
    throw new RequestBodyError("INVALID");
  }
}

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
