import {describe,expect,it} from "vitest";
import {learnerSafeExternalContentHref} from "@/modules/courses/learner-external-content-link-model";
describe("external learner course resource links",()=>{
 it("opens authored HTTPS classroom/resource URLs",()=>{
  expect(learnerSafeExternalContentHref("https://example.edu/meet?id=2")).toBe("https://example.edu/meet?id=2");
 });
 it.each(["javascript:alert(1)","data:text/html,<script>alert(1)</script>",
  "https://user:password@example.edu/private","/api/admin/export","not a URL",
  "https://example.edu/"+ "x".repeat(2048)])("rejects dangerous or unbounded resources: %s",v=>{
   expect(learnerSafeExternalContentHref(v)).toBeNull();
  });
});
