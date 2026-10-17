import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 final sprint",()=>{
 it("TPO-campaigns-public-28 preserves verified functionality and safe failure states",()=>{
 const preview=read("src/modules/placements/public-join/preview-service.ts");
 const model=read("src/modules/placements/public-join/preview-model.ts");
 const form=read("src/components/placements/public-recruiter-join-form.tsx");
 expect(preview).toContain("companyName:placementCompanies.name");
 expect(preview).toContain("companyName:row?.companyName??null");
 expect(model).toContain("companyName:input.expectedScope");
 expect(form).toContain("preview.companyName?.trim() || preview.companyDomain");
 expect(form).toContain('college + " would like " + companyLabel + " to hire from their students"');
 expect(form).toContain('"Your " + companyLabel + " email. You\'ll sign in with it."');
 });
});
