import {describe,it,expect} from "vitest";
import {z} from "zod";
describe("TPO verification setting input",()=>{it("requires a real boolean without trusting college scope",()=>{
 const schema=z.strictObject({tpoCanVerify:z.boolean()});
 expect(schema.safeParse({tpoCanVerify:false}).success).toBe(true);
 expect(schema.safeParse({tpoCanVerify:"false"}).success).toBe(false);
 expect(schema.safeParse({tpoCanVerify:true,collegeId:"foreign"}).success).toBe(false);
});});
