import {expect,it} from "vitest";
import {hrInterviewSlotActionSchema} from "@/modules/placements/hr-interview-slot-model";
const row={slotId:"11111111-1111-4111-8111-111111111111",action:"BOOK"};
it("accepts positive integer slot versions",()=>{
 expect(hrInterviewSlotActionSchema.safeParse({...row,expectedVersion:1}).success).toBe(true);
 expect(hrInterviewSlotActionSchema.safeParse({...row,expectedVersion:"2"}).success).toBe(true);
});
it.each([true,false,[],{},null,"01","1e2","1.0"," 1 ",0,-1,2.1,Infinity])(
 "rejects ambiguous optimistic version %s",expectedVersion=>{
 expect(hrInterviewSlotActionSchema.safeParse({...row,expectedVersion}).success).toBe(false);
});
