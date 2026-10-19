import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");
const footer=()=>read("src/components/tpo/tpo-mobile-footer.tsx");
const css=()=>read("src/components/shell/legacy-mobile-footer.css");

/** Original source: lms2-fe/prod-2026 MobileFooter.jsx:175-191,
 * mobileFooter.scss:1-41. Source checks only, not run by the builder. */
describe("chat-19 TPO five-icon mobile footer",()=>{
  it("preserves the legacy order, original distinct SVGs and current vNext routes",()=>{
    const source=footer();
    const names=["Home","Engage","Drives","Students","More"];
    const icons=["analytics.svg","contact.svg","assignment.svg","myAccount.svg","Menu-Icon.svg"];
    let last=-1;
    for(let i=0;i<names.length;i++){
      const index=source.indexOf('label:"'+names[i]+'"');
      expect(index).toBeGreaterThan(last);
      last=index;
      expect(source).toContain('icon:"/assets/images/common/'+icons[i]+'"');
      expect(existsSync("public/assets/images/common/"+icons[i])).toBe(true);
    }
    expect(source).toContain('href:"/tpo/placements"');
    expect(source).toContain('onClick={()=>setMoreOpen(open=>!open)}');
  });
  it("closes More on browser route commits or tablet/desktop resize",()=>{
    const source=footer();
    expect(source).toContain('import { useEffect, useState } from "react"');
    expect(source).toContain("useEffect(()=>{setMoreOpen(false);},[pathname]);");
    expect(source).toContain('window.matchMedia("(min-width: 768px)")');
    expect(source).toContain('media?.addEventListener("change",closeOnTablet)');
    expect(source).toContain('media?.removeEventListener("change",closeOnTablet)');
    expect(source).toContain('window.addEventListener("resize",closeOnTablet)');
    expect(source).toContain('window.removeEventListener("resize",closeOnTablet)');
    expect(source).toContain('onClick={()=>setMoreOpen(false)}');
    expect(source).toContain('className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 md:hidden"');
  });
  it("keeps shared buttons, valid opening/closing tags and icon-label contents",()=>{
    const source=footer();
    expect(source).toContain('import { Button } from "@/components/ui/button"');
    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain("<BottomSheet");
    expect(source).toContain("</BottomSheet>");
    expect(source).toContain("</Button>");
    expect(source).toContain("</Link>");
    expect(source).toContain('className="lms-tpo-mobile-footer-icon"');
    expect(source).toContain('className="lms-tpo-mobile-footer-label"');
  });
  it("copies legacy 24px icon, .5 inactive, 1 active, 10px captions and press",()=>{
    expect(css()).toContain("width:24px;height:24px");
    expect(css()).toContain("opacity:.5;transition:opacity .15s ease");
    expect(css()).toContain("transform:scale(.93)");
    expect(css()).toContain("font-size:10px;font-weight:500;color:#a9a7ae");
    expect(css()).toContain(".lms-tpo-mobile-footer-item.active .lms-tpo-mobile-footer-label");
    expect(css()).toContain("color:#26bac7;");
  });
});
