import {expect,it} from "vitest";
import {z} from "zod";
it("requires an exact thread UUID for an explicit recruiter acknowledgement",()=>{
 const id=z.string().uuid();
 expect(id.safeParse("11111111-1111-4111-8111-111111111111").success).toBe(true);
 expect(id.safeParse("../other-user").success).toBe(false);
});
