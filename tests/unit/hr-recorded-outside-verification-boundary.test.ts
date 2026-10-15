import {expect,it} from "vitest";
import {recordedOutsideDriveSchema} from "@/modules/placements/recorded-outside-model";
it("external-drive save confirmation requires validated UUID and scoped DB lookup",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(recordedOutsideDriveSchema.safeParse({collegeId:id,companyRelationshipId:id,title:"Recorded drive",
 occurredAt:"2026-10-01T10:00:00+05:30",recordedByUserId:id}).success).toBe(false);
});
