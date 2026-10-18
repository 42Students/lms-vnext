import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";

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
