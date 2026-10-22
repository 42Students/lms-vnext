import {describe,expect,it} from "vitest";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
describe("own application URL navigation",()=>{
it("restores committed filters and resets pagination",()=>{
const id="81818181-8181-4818-8818-818181818181";
const original="q=eng&view=progress&sort=company&page=3&applicationId="+id;
expect(readLearnerApplicationUrl(updateLearnerApplicationUrl(original,{q:"developer"}))).toMatchObject({
q:"developer",view:"all",sort:"company",page:1,applicationId:id});
expect(readLearnerApplicationUrl(original).q).toBe("eng");
});
it("round-trips the new screening-stage sort without accepting forged sorts",()=>{
expect(readLearnerApplicationUrl("sort=stage").sort).toBe("stage");
expect(readLearnerApplicationUrl("sort=untrusted").sort).toBe("activity");
});
it("drops forged identity and denies invalid values",()=>{
expect(updateLearnerApplicationUrl("q=ok&collegeId=forged",{view:"completed"})).not.toContain("collegeId");
expect(updateLearnerApplicationUrl("q=ok",{q:"x".repeat(101)})).toBe("");
expect(readLearnerApplicationUrl("collegeId=bad").q).toBe("");
});
});