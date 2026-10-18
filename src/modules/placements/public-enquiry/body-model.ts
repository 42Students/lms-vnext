import {readBoundedUtf8Body} from "@/lib/bounded-utf8-body";

/** Anonymous recruiter forms have small, fixed schemas.
 * Reject oversize/malformed JSON before public rate-limit or DB queries.
 * Do not expose parser errors or echo untrusted request content.
 */
export async function readPublicRecruitEnquiryBody(
 request:Request,
):Promise<{kind:"OK";value:unknown}|{kind:"INVALID"}|{kind:"TOO_LARGE"}>{
 const body=await readBoundedUtf8Body(request,8192);
 if(body.kind==="TOO_LARGE")return {kind:"TOO_LARGE"};
 if(body.kind!=="OK")return {kind:"INVALID"};
 try{return {kind:"OK",value:JSON.parse(body.body) as unknown};}
 catch{return {kind:"INVALID"};}
}
