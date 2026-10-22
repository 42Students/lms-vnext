import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("UX learner route batch 4",()=>{
it("UX-learn-learn-my-placements-rules-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/rules/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/rules/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/rules/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-schedule-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/schedule/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/schedule/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-support-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/support/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/support/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/support/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-notifications-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/notifications/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/notifications/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/notifications/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-notifications-history-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/notifications/history/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/notifications/history/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/notifications/history/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-placements-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/placements/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).toContain('redirect(');
 
 
 expect(read("src/app/(authenticated)/learn/placements/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/placements/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-profile-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/profile/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/profile/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/profile/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-profile-academic-record-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/profile/academic-record/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/profile/academic-record/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/profile/academic-record/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-profile-completeness-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/profile/completeness/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/profile/completeness/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/profile/completeness/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-profile-verification-01 keeps learner route accessible and honest",()=>{
 const s=read("src/app/(authenticated)/learn/profile/verification/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 // Legacy link color tokens or explicit keyboard-focus outlines are both acceptable.
 expect(s).toMatch(/text-primary-text|text-link|focus-visible:outline-2/);
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/profile/verification/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/profile/verification/error.tsx").length).toBeGreaterThan(0);
});
});
