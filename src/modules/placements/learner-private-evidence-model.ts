export type LearnerEvidenceReceipt={
 purpose:string;scanStatus:string;revokedAt:Date|null;retentionUntil:Date|null;
};
const allowed=["AADHAAR","PAN","MARKSHEET","RESUME"] as const;
export function learnerPrivateEvidenceSummary(rows:readonly LearnerEvidenceReceipt[],now:Date){
 return allowed.map(purpose=>{
   const own=rows.filter(r=>r.purpose===purpose && r.revokedAt===null &&
     (r.retentionUntil===null||r.retentionUntil>now));
   const clean=own.filter(r=>r.scanStatus==="CLEAN").length;
   return {purpose,recorded:own.length,cleanScanCount:clean,pendingScanCount:own.filter(r=>r.scanStatus==="PENDING").length};
 });
}
