import {expect,it} from "vitest";
import {recordedOutsideDriveSchema} from "@/modules/placements/recorded-outside-model";
it("persists exact college identity and rejects unvalidated claimed author",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(recordedOutsideDriveSchema.safeParse({collegeId:id,companyRelationshipId:id,
 title:"Drive already held elsewhere",occurredAt:"2026-10-01T09:00:00+05:30"}).success).toBe(true);
 expect(recordedOutsideDriveSchema.safeParse({collegeId:id,companyRelationshipId:id,
 title:"Drive already held elsewhere",occurredAt:"2026-10-01T09:00:00+05:30",recordedByRole:"TPO"}).success).toBe(false);
});
