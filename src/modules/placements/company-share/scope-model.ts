/** Pure denial policy used after persisted membership/role re-verification. */
export function isShareableJob(expectedCollege:string,actualCollege:string|null,status:string|null){
 return expectedCollege===actualCollege && (status==="PUBLISHED"||status==="CLOSED");
}
