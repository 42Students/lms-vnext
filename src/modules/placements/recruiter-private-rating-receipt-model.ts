/** Trusted shape of the recruiter-only private applicant review response.
 * A successful HTTP status alone is not proof the rating was persisted. */
export type RecruiterPrivateReviewReceipt={
 rating:number|null;
 note:string;
 updatedAt:string|null;
};

function isIsoTimestamp(value:unknown):value is string{
 if(typeof value!=="string"||
  !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))return false;
 const parsed=new Date(value);
 return Number.isFinite(parsed.getTime())&&parsed.toISOString()===value;
}

export function parseRecruiterPrivateReviewReceipt(value:unknown):
 RecruiterPrivateReviewReceipt|null{
 if(value===null||typeof value!=="object"||Array.isArray(value))return null;
 const object=value as Record<string,unknown>;
 const rating=object.rating;
 if(rating!==null&&(!Number.isInteger(rating)||typeof rating!=="number"||
  rating<1||rating>5))return null;
 if(typeof object.note!=="string"||object.note.length>1000)return null;
 const version=object.updatedAt;
 if(version!==null&&!isIsoTimestamp(version))return null;
 return {rating:rating as number|null,note:object.note,updatedAt:version};
}

/** A PATCH receipt must confirm the exact submitted edit, not a stale or
 * unrelated but syntactically valid private review. */
export function isConfirmedRecruiterPrivateReview(
 receipt:RecruiterPrivateReviewReceipt|null,
 requested:{rating:number|null;note:string},
):receipt is RecruiterPrivateReviewReceipt{
 return receipt!==null&&isIsoTimestamp(receipt.updatedAt)&&
  receipt.rating===requested.rating&&receipt.note===requested.note;
}
