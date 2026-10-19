import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

/** Source-only checks for B3/B4. These never imply completed visual verification. */
const read=(path:string)=>readFileSync(path,"utf8");
const legacy=()=>read("docs/design/old-lms-shell.css");
const sidebar=()=>read("src/components/shell/sidebar-legacy.css");

describe("chat-19 B3/B4 legacy shell source-value checks",()=>{
 it("retains the measured collapsed and expanded rail widths",()=>{
  expect(legacy()).toContain("width: 6rem; min-width: 6rem;");
  expect(sidebar()).toContain("width:96px;");
  expect(sidebar()).toContain("min-width:96px;");
  expect(sidebar()).toContain("width:256px;");
 });
 it("uses the legacy 150ms cubic bezier expansion",()=>{
 expect(legacy()).toContain("transition: width 0.15s cubic-bezier(0.2, 0, 0, 1)");
 expect(sidebar()).toContain("transition:width .15s cubic-bezier(.2,0,0,1)");
});
 it("pushes the full content column from 96 to 256 pixels",()=>{
 const css=sidebar();
 expect(css).toContain("padding-left:96px;");
 expect(css).toContain("padding-left:256px;");
 expect(css).toContain("~ .lms-shell-page");
});
 it("keeps the legacy white panel and light border",()=>{
 expect(legacy()).toContain("background: rgb(255, 255, 255); border-right: 1px solid rgb(241, 244, 249)");
 expect(sidebar()).toContain("background:#fff;");
 expect(sidebar()).toContain("border-right:1px solid #f1f4f9;");
});
 it("matches 44px navigation items and 8px corners",()=>{
 expect(legacy()).toContain("border-radius: 8px; min-height: 44px; padding: 10px 12px");
 expect(sidebar()).toContain("min-height:44px;");
 expect(sidebar()).toContain("padding:10px 12px;");
 expect(sidebar()).toContain("border-radius:8px;");
});
 it("matches the teal active fill and inset bar",()=>{
 expect(legacy()).toContain("box-shadow: rgb(38, 186, 199) 3px 0px inset;");
 expect(sidebar()).toContain("background:#eff8fa;");
 expect(sidebar()).toContain("box-shadow:inset 3px 0 #26bac7;");
});
 it("keeps 7-percent teal hover wash and teal labels",()=>{
 expect(legacy()).toContain("background: rgba(38, 186, 199, 0.07)");
 expect(sidebar()).toContain("background:rgba(38,186,199,.07);");
 expect(sidebar()).toContain("color:#1a95a1;");
});
 it("preserves 24px icon box and 20px upstream glyph",()=>{
 expect(legacy()).toContain("opacity: 0.55; flex: 0 0 24px");
 expect(sidebar()).toContain("flex:0 0 24px;");
 expect(sidebar()).toContain("opacity:.55;");
 expect(sidebar()).toContain("width:20px;height:20px;");
});
 it("changes TPO group headings from zero-font separators to 12px uppercase",()=>{
 const css=sidebar();
 expect(css).toContain("font-size:0;");
 expect(css).toContain("font-size:12px;");
 expect(css).toContain("width:22px;");
 expect(css).toContain("letter-spacing:.105em;");
 expect(css).toContain("text-transform:uppercase;");
});
 it("pins collapsed counts above the glyph then restores inline expanded counts",()=>{
 expect(legacy()).toContain("transform: scale(0.72);");
 const css=sidebar();
 expect(css).toContain("transform:scale(.72);");
 expect(css).toContain("top:4px;");
 expect(css).toContain("left:50%;");
 expect(css).toContain("margin-left:auto;");
});
 it("uses the legacy 2px focus ring inset by 2px",()=>{
 expect(legacy()).toContain("outline-offset: -2px; outline: rgba(38, 186, 199, 0.45) solid 2px");
 expect(sidebar()).toContain("outline:2px solid rgba(38,186,199,.45);");
 expect(sidebar()).toContain("outline-offset:-2px;");
});
 it("uses the original four-pixel TPO hover scrollbar",()=>{
 expect(legacy()).toContain("scrollbar-width: thin; scrollbar-color:");
 const css=sidebar();
 expect(css).toContain('data-sidebar-portal="tpo"');
 expect(css).toContain("scrollbar-width:thin;");
 expect(css).toContain("width:4px;");
});
 it("mounts the copied 38x36 logo on desktop and mobile",()=>{
 const shell=read("src/components/shell/app-shell.tsx");
 const mobile=read("src/components/shell/mobile-navigation.tsx");
 const icons=read("src/components/shell/shell-nav-icons.tsx");
 expect(shell).toContain("<ShellLogoMark />");
 expect(mobile).toContain("<ShellLogoMark />");
 expect(icons).toContain('width="38" height="36"');
});
 it("preserves AntD mobile drawer width and safe-area body padding",()=>{
 const mobile=read("src/components/shell/mobile-navigation.tsx");
 expect(mobile).toContain("w-[min(82vw,300px)]");
 expect(mobile).toContain("env(safe-area-inset-bottom,0px)");
 expect(sidebar()).toContain("padding-inline:12px;");
});
});
