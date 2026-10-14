import {describe,expect,it} from "vitest";
import {ownLearnerSupportRequestList,learnerSupportHistoryHref}
from "@/modules/placements/learner-support-request-model";
const row=(n:number,type="APPLICATION_WITHDRAWAL",status="PENDING")=>({
  request:{id:String(n),requestType:type,status,reason:"Reason",
    requestedAt:new Date(1700000000000+n),updatedAt:new Date(1700000000000+n),
    decisionNote:null},job:{id:"job",title:"Engineering"},
  roleOption:{title:"Engineer"},company:{name:"Acme"},
});
describe("learner support request history and type pagination",()=>{
  const rows=Array.from({length:48},(_,n)=>row(n));
  it("navigates every own request without truncation or false results",()=>{
    const a=ownLearnerSupportRequestList(rows,{page:"1"});
    expect(a).toMatchObject({page:1,total:48,totalPages:3,hasMore:true,hasPrevious:false});
    expect(a.items).toHaveLength(20);
    const c=ownLearnerSupportRequestList(rows,{page:"3"});
    expect(c).toMatchObject({page:3,total:48,hasMore:false,hasPrevious:true});
    expect(c.items).toHaveLength(8);
  });
  it("keeps status/type and limits all untrusted fields",()=>{
    const mixed=[row(1),row(2,"OFFER_EXTENSION","APPROVED")];
    expect(ownLearnerSupportRequestList(mixed,{type:"OFFER_EXTENSION",status:"APPROVED"}).total).toBe(1);
    expect(learnerSupportHistoryHref({status:"APPROVED",type:"OFFER_EXTENSION",page:2}))
      .toContain("status=APPROVED&type=OFFER_EXTENSION&page=2");
    for(const invalid of [{collegeId:"foreign"},{type:"FILE_UPLOAD"},{page:"-5"}])
      expect(()=>ownLearnerSupportRequestList(mixed,invalid)).toThrow();
  });
});