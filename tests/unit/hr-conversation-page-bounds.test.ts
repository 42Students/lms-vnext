import {expect,it} from "vitest";
import {z} from "zod";
it("rejects invalid recruiter thread page values",()=>{
 const page=z.coerce.number().int().min(1).max(10000);
 expect(page.safeParse("-2").success).toBe(false);
 expect(page.safeParse("1").success).toBe(true);
});
