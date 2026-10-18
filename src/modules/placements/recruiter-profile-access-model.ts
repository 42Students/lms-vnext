/** A DELETE 200 is not evidence of persisted revocation: a sign-in
 * fallback or unrelated JSON response can also be successful HTTP. */
export function isConfirmedRecruiterLeaveResponse(raw:unknown,grantId:string):boolean{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const access=(raw as Record<string,unknown>).access;
 if(!access||typeof access!=="object"||Array.isArray(access))return false;
 const row=access as Record<string,unknown>;
 return row.status==="REVOKED" && row.grantId===grantId;
}
