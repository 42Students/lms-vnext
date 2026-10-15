import {expect,it} from "vitest";
import {hrRoundFormSchema,canRecruiterEditRound,duplicateRecruiterRoundName} from "@/modules/placements/hr-round-editor-model";
it("only edits recruiter-created pending unused rounds",()=>{
 expect(canRecruiterEditRound({status:"PENDING",createdByUserId:"r",recruiterUserId:"r",hasResults:false})).toBe(true);
 expect(canRecruiterEditRound({status:"SCHEDULED",createdByUserId:"r",recruiterUserId:"r",hasResults:false})).toBe(false);
 expect(canRecruiterEditRound({status:"PENDING",createdByUserId:"tpo",recruiterUserId:"r",hasResults:false})).toBe(false);
 expect(canRecruiterEditRound({status:"PENDING",createdByUserId:"r",recruiterUserId:"r",hasResults:true})).toBe(false);
});
it("rejects malformed actions and duplicate names",()=>{
 expect(hrRoundFormSchema.safeParse({action:"CREATE",kind:"INTERVIEW",name:"Interview"}).success).toBe(true);
 expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:"bad"}).success).toBe(false);
 expect(duplicateRecruiterRoundName([{id:"1",name:" Phone   interview ",status:"PENDING"}],"phone interview")).toBe(true);
});
