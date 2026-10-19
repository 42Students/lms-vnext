import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");
const css=()=>source("src/components/shell/route-transition.css");
const route=()=>source("src/components/shell/route-transition.tsx");
const legacy=()=>source("docs/design/legacy-styles/components___learn-layout.scss");

/** Source-only guardrails; no runtime/CI checks requested by the owner. */
describe("chat-19 old-LMS route transition parity",()=>{
 it("matches legacy pageSlideIn initial and final offsets",()=>{
 expect(legacy()).toContain("transform: translateY(8px)");
 expect(css()).toContain("transform:translateY(8px)");
 expect(css()).toContain("transform:translateY(0)");
});
 it("animates only page content on 250ms ease-out",()=>{
 expect(legacy()).toContain("animation: pageSlideIn 250ms ease-out");
 expect(css()).toContain("animation:lms-route-slide-in 250ms ease-out");
});
 it("uses a 220ms legacy fade with the measured easing",()=>{
 expect(legacy()).toContain("opacity 220ms cubic-bezier(0.2, 0.8, 0.2, 1)");
 expect(css()).toContain("opacity 220ms cubic-bezier(.2,.8,.2,1)");
});
 it("keeps legacy 260ms transform timing",()=>{
 expect(legacy()).toContain("transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)");
 expect(css()).toContain("transform 260ms cubic-bezier(.2,.8,.2,1)");
});
 it("keeps legacy pending-route opacity 0.78",()=>{
 expect(legacy()).toContain("opacity: 0.78");
 expect(css()).toContain("opacity:.78");
});
 it("keeps legacy 6px and 0.998 route exit movement",()=>{
 expect(legacy()).toContain("translateY(6px) scale(0.998)");
 expect(css()).toContain("translateY(6px) scale(.998)");
});
 it("disables entry and exit movement for reduced motion",()=>{
 expect(css()).toContain("@media (prefers-reduced-motion:reduce)");
 expect(css()).toContain("animation:none;transition:none;transform:none");
 expect(css()).toContain("opacity:1;transform:none;will-change:auto");
});
 it("keys route entry only on pathname, not the query string",()=>{
 expect(route()).toContain("key={pathname}");
 expect(route()).not.toContain("useSearchParams");
});
 it("keeps route animation inside main instead of shell chrome",()=>{
 const shell=source("src/components/shell/app-shell.tsx");
 expect(shell).toContain("<RouteTransition>{children}</RouteTransition>");
 expect(shell.indexOf("<RouteTransition>")).toBeGreaterThan(shell.indexOf("<LegacyTopbar"));
});
});
