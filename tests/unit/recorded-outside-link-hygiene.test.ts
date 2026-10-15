import {it,expect} from "vitest";
import {recordedOutsideDriveSchema} from "@/modules/placements/recorded-outside-model";
const base={collegeId:"11111111-1111-4111-8111-111111111111",
 companyRelationshipId:"22222222-2222-4222-8222-222222222222",
 title:"Off-platform drive",occurredAt:"2025-10-15T10:00:00+05:30"};
it("accepts an ordinary HTTPS external record reference",()=>{
 expect(recordedOutsideDriveSchema.safeParse({...base,externalReferenceUrl:"https://example.org/drive/123"}).success).toBe(true);
});
it.each(["http://example.org","https://user:secret@example.org/report",
 "https://example.org/report#hidden","https://example.org/"+ "a".repeat(2000)])(
 "rejects unsafe externally recorded links %s",externalReferenceUrl=>{
 expect(recordedOutsideDriveSchema.safeParse({...base,externalReferenceUrl}).success).toBe(false);
});
