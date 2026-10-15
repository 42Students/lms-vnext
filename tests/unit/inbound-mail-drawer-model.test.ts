import {describe,it,expect} from "vitest";
import {inboundMailDetailSchema,safeMailDrawerText} from "@/modules/inbound-mail/drawer-model";
describe("inbound mail detail",()=>{
 it("drops null characters and bounds rendered plain text",()=>{expect(safeMailDrawerText("hello\u0000world")).toBe("helloworld");expect(safeMailDrawerText("x".repeat(100001))).toHaveLength(100000);});
 it("rejects HTML payload fields",()=>{expect(inboundMailDetailSchema.safeParse({html:"<script>alert(1)</script>"}).success).toBe(false);});
});
