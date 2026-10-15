import {expect,it} from "vitest";
import {safeProjectExternalHref} from "@/modules/projects/mentor-workspace-evidence-model";
it("only produces credential-free HTTP(S) project links",()=>{
 expect(safeProjectExternalHref("https://example.com/docs")).toBe("https://example.com/docs");
 expect(safeProjectExternalHref("http://example.com")).toBe("http://example.com/");
 for(const input of ["javascript:alert(1)","https://user:secret@example.com","file:///private","//example.com","not a url"]){
  expect(safeProjectExternalHref(input)).toBeNull();
 }
});
