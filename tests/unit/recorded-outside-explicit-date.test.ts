import {it,expect} from "vitest";
import {recordedOutsideDriveSchema} from "@/modules/placements/recorded-outside-model";
const base={collegeId:"11111111-1111-4111-8111-111111111111",
 companyRelationshipId:"22222222-2222-4222-8222-222222222222",
 title:"Campus drive",occurredAt:"2025-10-15T10:00:00+05:30"};
it("accepts a historical dated record in explicit IST",()=>{
 expect(recordedOutsideDriveSchema.safeParse(base).success).toBe(true);
});
it.each([true,false,0,null,[],"2025-10-15","not-a-date"])(
 "rejects ambiguous or coerced occurrence %s",occurredAt=>{
 expect(recordedOutsideDriveSchema.safeParse({...base,occurredAt}).success).toBe(false);
});
