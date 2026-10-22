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
    expect(source).toContain('href:"/tpo/more"');
    expect(source).not.toContain('target="_blank"');
  });
  it("keeps More navigation in the same tab and marks its secondary routes active",()=>{
    const source=footer();
    const morePage=read("src/app/(authenticated)/tpo/more/page.tsx");
    expect(source).toContain('import { usePathname } from "next/navigation"');
    expect(source).toContain('pathname === href || pathname.startsWith(href + "/")');
    expect(source).toContain('aria-current={active ? "page" : undefined}');
    expect(source).toContain('href:"/tpo/more"');
    expect(source).not.toContain('target="_blank"');
    expect(morePage).toContain('hasMembershipRole(context, "TPO")');
    expect(morePage).toContain("<TpoMoreNavigation />");
    expect(source).toContain('className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 grid min-w-0 grid-cols-5 md:hidden"');
  });
  it("keeps accessible link names, valid tags and icon-label contents",()=>{
    const source=footer();
    expect(source).toContain('import Image from "next/image"');
    expect(source).toContain('import Link from "next/link"');
    expect(source).toContain('aria-label="TPO mobile footer"');
    expect(source).toContain('title={link.label}');
    expect(source).toContain('</Link>');
    expect(source).toContain('className="lms-tpo-mobile-footer-icon"');
    expect(source).toContain('className="lms-tpo-mobile-footer-label"');
  });
  it("copies legacy 24px icon, .5 inactive, 1 active, 10px captions and press",()=>{
    expect(css()).toContain("width:24px;height:24px");
    expect(css()).toContain("opacity:.5;transition:opacity .15s ease");
    expect(css()).toContain("transform:scale(.93)");
    expect(css()).toContain("font-size:10px;font-weight:500;color:var(--lms-neutral-400)");
    expect(css()).toContain(".lms-tpo-mobile-footer-item.active .lms-tpo-mobile-footer-label");
    expect(css()).toContain("color:var(--lms-primary);");
  });
});
