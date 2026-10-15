import {it,expect} from "vitest";
import {publicJoinPreviewForDisplay as p} from "@/modules/placements/public-join/preview-model";
it("never reveals wrong-scope, expired or revoked join targets",()=>{
 const x={token:"t".repeat(40),expectedScope:"COLLEGE" as const,
  persistedScope:"COLLEGE" as const,validUntilMs:200,nowMs:100,
  collegeActive:true,collegeName:"Test College",companyDomain:null,revoked:false};
 expect(p(x)).toEqual({kind:"READY",collegeName:"Test College",companyDomain:null});
 expect(p({...x,expectedScope:"COMPANY"})).toEqual({kind:"UNAVAILABLE"});
 expect(p({...x,nowMs:200})).toEqual({kind:"UNAVAILABLE"});
 expect(p({...x,revoked:true})).toEqual({kind:"UNAVAILABLE"});
 expect(p({...x,token:"/bad"})).toEqual({kind:"UNAVAILABLE"});
});
