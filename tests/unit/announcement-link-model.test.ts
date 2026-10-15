import {describe,it,expect} from "vitest";
import {safeAnnouncementLink} from "@/modules/announcements/link-model";
describe("Super Admin announcement link presentation",()=>{
 it("extracts safe HTTPS links from existing announcement plain text",()=>{
 expect(safeAnnouncementLink("Open https://example.com/resource.")).toBe("https://example.com/resource");
 expect(safeAnnouncementLink("No link")).toBeNull();
 });
 it("never turns scripts or credential URLs into clickable actions",()=>{
 expect(safeAnnouncementLink("javascript:alert(1)")).toBeNull();
 expect(safeAnnouncementLink("https://user:secret@example.com")).toBeNull();
 });
});
