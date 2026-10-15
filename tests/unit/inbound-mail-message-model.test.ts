import {describe,it,expect} from "vitest";
import {inboundMailListQuerySchema,safeInboundPreview} from "@/modules/inbound-mail/message-model";
describe("inbound mail search",()=>{
 it("rejects unknown filters and unbounded pages",()=>{
 expect(inboundMailListQuerySchema.safeParse({collegeId:"other"}).success).toBe(false);
 expect(inboundMailListQuerySchema.safeParse({page:-1}).success).toBe(false);
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
