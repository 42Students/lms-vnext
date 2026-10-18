import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 bounded loading /admin last third B",()=>{
  it("UX-admin-students-02 renders a bounded, recoverable loading state",()=>{
    const page=source("src/app/(authenticated)/admin/students/loading.tsx");
    expect(page).toContain("GracefulPageLoading");
    expect(page).toContain("Loading students");
    expect(page).not.toContain("animate-pulse");
  });
  it("UX-admin-tenants-02 renders a bounded, recoverable loading state",()=>{
    const page=source("src/app/(authenticated)/admin/tenants/loading.tsx");
    expect(page).toContain("GracefulPageLoading");
    expect(page).toContain("Loading tenants");
    expect(page).not.toContain("animate-pulse");
  });
  it("UX-admin-tenants-setup-02 renders a bounded, recoverable loading state",()=>{
    const page=source("src/app/(authenticated)/admin/tenants/setup/loading.tsx");
    expect(page).toContain("GracefulPageLoading");
    expect(page).toContain("Loading tenant setup");
    expect(page).not.toContain("animate-pulse");
  });
  it("UX-admin-videos-02 renders a bounded, recoverable loading state",()=>{
    const page=source("src/app/(authenticated)/admin/videos/loading.tsx");
    expect(page).toContain("GracefulPageLoading");
    expect(page).toContain("Loading videos");
    expect(page).not.toContain("animate-pulse");
  });
});
