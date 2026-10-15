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
});