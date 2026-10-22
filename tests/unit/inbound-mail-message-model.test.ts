import {describe,it,expect} from "vitest";
import {inboundMailListQuerySchema,safeInboundPreview} from "@/modules/inbound-mail/message-model";
describe("inbound mail search",()=>{
 it("rejects unknown filters and malformed or unbounded legacy paging",()=>{
 expect(inboundMailListQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
 // Malformed or excessive pages must be rejected; silently clamping an
 // invalid user-supplied query could widen or misrepresent the scoped result.
 for(const page of [-1,0,1_000_000,"garbage","0","",true,["1","2"]])
  expect(inboundMailListQuerySchema.safeParse({page}).success).toBe(false);
 expect(inboundMailListQuerySchema.parse({}).page).toBe(1);
 expect(inboundMailListQuerySchema.parse({page:"10000"}).page).toBe(10000);
 });
 it("normalizes previews without control characters",()=>{
 expect(safeInboundPreview("Hi\n there")).toBe("Hi there");
 });
 it("validates exact recipient mailbox search and denies duplicate or invalid values",()=>{
  expect(inboundMailListQuerySchema.parse({recipient:" INFO@EXAMPLE.EDU "}).recipient).toBe("info@example.edu");
  expect(inboundMailListQuerySchema.safeParse({recipient:["a@example.edu","b@example.edu"]}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({recipient:"*%other"}).success).toBe(false);
 });
});
