/** The generic notification endpoint returns {notification}; a redirected
 * sign-in page or unrelated HTTP-200 JSON is never a persisted read receipt. */
export function isVerifiedRecruiterDecisionReadReceipt(raw:unknown,id:string):boolean{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const notification=(raw as Record<string,unknown>).notification;
 if(!notification||typeof notification!=="object"||Array.isArray(notification))return false;
 const value=notification as Record<string,unknown>;
 return value.id===id&&typeof value.readAt==="string"&&
  Number.isFinite(Date.parse(value.readAt));
}
