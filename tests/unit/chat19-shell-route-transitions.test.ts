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
});
