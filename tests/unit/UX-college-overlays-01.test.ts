import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const root="src/components/college/";
const source=(name:string)=>readFileSync(join(process.cwd(),root+name+".tsx"),"utf8");
const sharedDialog=readFileSync(join(process.cwd(),"src/components/ui/dialog.tsx"),"utf8");
const overlayExit=readFileSync(join(process.cwd(),"src/components/ui/use-overlay-exit.ts"),"utf8");
describe("UX-college-overlays-01 college dialog behavior",()=>{
  for(const name of [
    "college-faculty-reassign-action","college-faculty-schedule-reassign",
    "college-offering-metadata-action","college-person-audit-modal",
    "college-person-edit-action","college-person-profile-overview-modal",
    "college-student-import-history",
  ]){
    it(name+" delegates accessible modal focus/Escape/backdrop to shared Dialog",()=>{
      const component=source(name);
      expect(component).toContain('import {Dialog} from "@/components/ui/dialog"');
      expect(component).toContain("<Dialog open={open}");
      expect(component).toContain("onOpenChange=");
      expect(component).toContain("title=");
      expect(component).toContain("min-h-11");
      expect(sharedDialog).toContain('aria-labelledby={titleId}');
      expect(sharedDialog).toContain("useOverlayExit(ref, opener, open, 180)");
      expect(overlayExit).toContain("dialog.showModal()");
      expect(overlayExit).toContain("if (opener?.isConnected) opener.focus()");
      expect(sharedDialog).toContain("opener.current?.focus()");
      expect(sharedDialog).toContain("onCancel={event");
      expect(sharedDialog).toContain("event.target === ref.current");
      expect(sharedDialog).toContain('<ScrollCue axis="y"');
    });
  }
  it("use-college-confirmation delegates destructive confirmation to shared ConfirmDialog",()=>{
    const component=source("use-college-confirmation");
    expect(component).toContain('import {ConfirmDialog} from "@/components/ui/confirm-dialog"');
    expect(component).toContain("<ConfirmDialog");
    expect(component).toContain("onOpenChange=");
    expect(component).not.toContain("window.confirm");
  });
});
