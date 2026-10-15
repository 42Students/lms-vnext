import {expect,it} from "vitest";
import {verifyClassTeamPreview} from "@/modules/projects/class-team-preview-validation";
const a="11111111-1111-4111-8111-111111111111",b="22222222-2222-4222-8222-222222222222";
it("does not create visually duplicate Unicode team names",()=>{
 expect(()=>verifyClassTeamPreview([
 {name:"Alpha",membershipIds:[a]},{name:"Ａlpha",membershipIds:[b]},
 ],[a,b])).toThrow("Duplicate team name");
});
it("treats repeated internal whitespace as the same displayed name",()=>{
 expect(()=>verifyClassTeamPreview([
 {name:"Team  A",membershipIds:[a]},{name:"Team A",membershipIds:[b]},
 ],[a,b])).toThrow("Duplicate team name");
});
it("allows distinct names with every learner assigned exactly once",()=>{
 expect(verifyClassTeamPreview([
 {name:"North",membershipIds:[a]},{name:"South",membershipIds:[b]},
 ],[a,b])).toHaveLength(2);
});
