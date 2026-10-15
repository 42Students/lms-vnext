import {expect,it} from "vitest";
import {z} from "zod";
it("accepts a single UUID, not arbitrary URL fragments",()=>{
 const schema=z.string().uuid();
 expect(schema.safeParse("11111111-1111-4111-8111-111111111111").success).toBe(true);
 expect(schema.safeParse("%2Fadmin").success).toBe(false);
});
