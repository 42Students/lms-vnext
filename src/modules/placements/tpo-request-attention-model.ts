type RequestAttention={status:string;urgent:boolean;requestedAt:Date;
 reason:string;decisionNote:string|null};
export function tpoRequestAttentionOnPage(rows:readonly RequestAttention[],asOf:Date){
 const pending=rows.filter(r=>r.status==="PENDING");
 return{
  urgent:pending.filter(r=>r.urgent).length,
  waitingOverTwoDays:pending.filter(r=>asOf.getTime()-r.requestedAt.getTime()>2*86400000).length,
  proofUnconfirmed:pending.filter(r=>/proof|letter|document|attachment/i.test(r.reason)).length,
  waiting:pending.length,
  totalDisplayed:rows.length,
 };
}
