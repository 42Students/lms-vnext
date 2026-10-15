import {expect,it} from "vitest";
import {tpoShareableShortlistCsv} from "@/modules/placements/tpo-shareable-shortlist-model";
it("uses the same safe three-column share-preview export",()=>{
 const csv=tpoShareableShortlistCsv([{applicationId:"id",displayName:"=2+2",email:"+inject"}],true);
 expect(csv).toContain("NOTICE");
 expect(csv).toContain("Application ID");
 expect(csv).not.toContain("Phone");
 expect(csv).not.toContain("Resume");
 expect(csv).not.toContain(',"=2+2",');
});
