import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("chat-16 Telegram digest without provider secrets",()=>{
  it("SA-placements-projects-116 previews digest offline while disabling only sends",()=>{
    const source=readFileSync("src/components/tracker/tracker-telegram-manual-panel.tsx","utf8");
    expect(source).toContain('<button type="button" disabled={pending} onClick={()=>setOpen(true)}');
    expect(source).toContain('<button type="button" disabled={!configured||pending} onClick={()=>setConfirm("TEST")}');
    expect(source).toContain('<button type="button" disabled={!configured||pending} onClick={()=>setConfirm("DIGEST")}');
    expect(source).toContain("Telegram alerts are not configured. Manual sends are unavailable.");
    expect(source).toContain("This preview covers the latest visible Known Errors only.");
    expect(source).toContain("New error types in this window");
    expect(source).toContain("Regressions");
    expect(source).toContain("Marked fixed");
    expect(source).toContain("Deploy");
  });
});
