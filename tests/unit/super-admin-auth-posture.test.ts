import {describe,it,expect} from "vitest";
import {platformAuthPostureItems} from "@/modules/platform-settings/auth-posture-model";
describe("privileged authentication policy inventory",()=>{
 it("never marks a policy verified without runtime evidence",()=>{
 const rows=platformAuthPostureItems();
 expect(rows.find(x=>x.id==="privileged-mfa")?.state).toBe("RUNTIME UNVERIFIED");
 expect(rows.map(x=>x.id)).toContain("cookie");
 expect(rows.every(x=>!x.state.includes("ENABLED"))).toBe(true);
 });
});
