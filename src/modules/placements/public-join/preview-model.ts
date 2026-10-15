import { publicCollegeJoinTokenSchema } from "../public-college-join-model";
export type PublicJoinPreview = {kind:"UNAVAILABLE"} |
  {kind:"READY";collegeName:string;companyDomain:string|null};
export function publicJoinPreviewForDisplay(input:{
 token:string;expectedScope:"COLLEGE"|"COMPANY";
 persistedScope:"COLLEGE"|"COMPANY"|null;
 validUntilMs:number|null;nowMs:number;
 collegeActive:boolean;collegeName:string|null;
 companyDomain:string|null;revoked:boolean;
}):PublicJoinPreview{
 if(!publicCollegeJoinTokenSchema.safeParse(input.token).success ||
    input.persistedScope!==input.expectedScope || input.revoked ||
    !input.collegeActive || !input.collegeName || input.validUntilMs===null ||
    !Number.isFinite(input.nowMs)||input.validUntilMs<=input.nowMs ||
    (input.expectedScope==="COMPANY"&&!input.companyDomain))return {kind:"UNAVAILABLE"};
 return {kind:"READY",collegeName:input.collegeName,
  companyDomain:input.expectedScope==="COMPANY"?input.companyDomain:null};
}
