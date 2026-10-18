import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "@/db/client";
import { getCollegeSignInName } from "@/modules/auth/tenant-branding";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
const db=vi.mocked(getDb);
const COLLEGE="11111111-1111-4111-8111-111111111111";

describe("WEAK-auth-branding-01 public tenant display is college-scoped and ACTIVE-only",()=>{
  beforeEach(()=>vi.clearAllMocks());
  function mockQuery(rows:Array<{name:string}>) {
    const limit=vi.fn(async()=>rows);
    const where=vi.fn(()=>({limit}));
    const from=vi.fn(()=>({where}));
    const select=vi.fn(()=>({from}));
    db.mockReturnValue({select} as never);
    return {select,from,where,limit};
  }
  it("WEAK-auth-branding-01 loads only one authorized college name",async()=>{
    const q=mockQuery([{name:"IIT Dharwad"}]);
    await expect(getCollegeSignInName(COLLEGE)).resolves.toBe("IIT Dharwad");
    expect(q.select).toHaveBeenCalledOnce();
    expect(q.where).toHaveBeenCalledOnce();
    expect(q.limit).toHaveBeenCalledWith(1);
  });
  it("WEAK-auth-branding-02 returns null for missing/archived college rather than falling back to another tenant",async()=>{
    const q=mockQuery([]);
    await expect(getCollegeSignInName(COLLEGE)).resolves.toBeNull();
    expect(q.limit).toHaveBeenCalledWith(1);
  });
  it("WEAK-auth-branding-03 always applies ACTIVE college predicate, not an unscoped name lookup",()=>{
    const source=readFileSync(join(process.cwd(),"src/modules/auth/tenant-branding.ts"),"utf8");
    expect(source).toContain('eq(colleges.id, collegeId)');
    expect(source).toContain('eq(colleges.status,"ACTIVE")');
    expect(source).toContain(".limit(1)");
  });
});
