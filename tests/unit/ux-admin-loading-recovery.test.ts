import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
it("UX-admin-assignments-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/assignments/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading assignments\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-attendance-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/attendance/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading scoped attendance\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-audit-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/audit/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading activity\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-batch-promotion-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/batch-promotion/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading batch promotion preview\"");expect(p).not.toContain("animate-pulse");});

it("UX-admin-batches-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/batches/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading batches\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-classes-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/classes/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading classes\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-companies-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/companies/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading company directory\"");expect(p).not.toContain("animate-pulse");});
it("UX-admin-course-progress-03 bounded loading",()=>{const p=read("src/app/(authenticated)/admin/course-progress/loading.tsx");expect(p).toContain("GracefulPageLoading");expect(p).toContain("label=\"Loading course progress\"");expect(p).not.toContain("animate-pulse");});
