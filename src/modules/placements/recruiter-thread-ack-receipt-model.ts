/** Verification only; a bare 2xx (including a sign-in redirect) is not
 * proof that a specific recruiter conversation was acknowledged. */
export function isVerifiedRecruiterThreadAcknowledgement(
 raw:unknown,
 threadId:string,
):boolean{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const data=raw as Record<string,unknown>;
 return data["saved"]===true&&data["threadId"]===threadId&&
  typeof data["acknowledged"]==="number"&&Number.isSafeInteger(data["acknowledged"])&&
  data["acknowledged"]>=0;
}
