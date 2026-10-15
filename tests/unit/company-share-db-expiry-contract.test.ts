import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
import {isCompanyShareLive} from "@/modules/placements/company-share/token-model";
it("denies exact expiry and keeps DB-time validation inside the locked reader",()=>{
 const expiresAt=new Date("2026-10-15T15:00:00Z");
 expect(isCompanyShareLive({expiresAt,revokedAt:null},expiresAt)).toBe(false);
 const source=readFileSync(join(process.cwd(),"src/modules/placements/company-share/public-service.ts"),"utf8");
 expect(source).toContain("gt(shares.expiresAt,sql`clock_timestamp()`)");
 expect(source).toContain('.for("share",{of:shares})');
 expect(source).not.toContain("gt(shares.expiresAt,now)");
});
