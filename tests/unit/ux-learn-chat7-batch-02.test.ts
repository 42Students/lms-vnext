import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("UX learner route batch 2",()=>{
it("UX-learn-learn-courses-deliveryId-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).toContain('redirect(');
 
 
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-courses-deliveryId-courseTab-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-courses-deliveryId-attendance-summary-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-courses-deliveryId-progress-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/progress/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/courses/[deliveryId]/progress/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-announcements-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/announcements/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/announcements/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/announcements/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-applications-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/applications/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/applications/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/applications/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-applications-applicationId-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 expect(s).toContain('min-w-0');
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-applications-applicationId-company-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/error.tsx").length).toBeGreaterThan(0);
});
it("UX-learn-learn-my-placements-applications-applicationId-history-01 maintains learner UX and route states",()=>{
 const s=read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx");
 expect(s.length).toBeGreaterThan(0);
 expect(s).not.toContain('text-[#26bac7]');
 expect(s).toContain('text-primary-text');
 
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/loading.tsx").length).toBeGreaterThan(0);
 expect(read("src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/error.tsx").length).toBeGreaterThan(0);
});
});
