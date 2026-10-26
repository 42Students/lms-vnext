import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {emptyHrDriveDraft,hrDriveDraftSchema} from "@/modules/placements/hr-drive-draft-model";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("chat-7 recruiter drive request legacy safety",()=>{
it("REC-home-drives-27 matches the reviewed contract",()=>{const s=read("src/modules/placements/hr-drive-draft-model.ts");for(const phrase of ["description: z.string().trim().max(5000)","location: z.string().trim().max(180)","rounds: z.array(round).max(HR_DRIVE_ROUND_LIMIT","CTC is required"])expect(s).toContain(phrase);const draft={...emptyHrDriveDraft(),title:"Engineer",ctcLpa:"10",rounds:[],description:"",location:""};expect(hrDriveDraftSchema.safeParse(draft).success).toBe(true);expect(hrDriveDraftSchema.safeParse({...draft,ctcLpa:""}).success).toBe(false);});
it("REC-home-drives-30 matches the reviewed contract",()=>{const s=read("src/components/hr/hr-drive-draft-form.tsx");for(const phrase of ["setSavedRequestId(","Sent to the placement cell for review","Open the request","Go to Drives","Request another"])expect(s).toContain(phrase);});
it("REC-home-drives-32 matches the reviewed contract",()=>{const s=read("src/components/hr/hr-drive-draft-form.tsx");for(const phrase of ["beforeunload","Leave without these changes?","Discard all unsent draft changes and clear this tab\'s saved copy?"])expect(s).toContain(phrase);});
it("Recruiter eligibility hints do not promise that every registered learner can apply",()=>{const s=read("src/components/hr/hr-drive-draft-form.tsx");expect(s).toContain("The placement cell still verifies eligibility before students can apply.");expect(s).not.toContain("Leave these blank to include every registered student.");});
});
