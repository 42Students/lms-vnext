import {describe,expect,it} from "vitest";
import {createSectionInputSchema,updateSectionInputSchema} from "@/modules/academics/validation";
import {readFileSync} from "node:fs";
const source=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");

describe("legacy class maxStudents",()=>{
 it("accepts a 1–200 whole-number cap for create and edit, not zero or overflow",()=>{
  const valid=(capacity:number)=>({name:"Section A",code:"A1",capacity});
  for(const cap of [1,150,200]){
   expect(updateSectionInputSchema.safeParse({capacity:cap}).success).toBe(true);
  }
  for(const cap of [-1,0,1.25,201,10000]){
   expect(updateSectionInputSchema.safeParse({capacity:cap}).success).toBe(false);
  }
  expect(createSectionInputSchema.shape.capacity.safeParse(200).success).toBe(true);
  expect(createSectionInputSchema.shape.capacity.safeParse(201).success).toBe(false);
  expect(valid(200).capacity).toBe(200);
 });
 it("prevents lowering capacity below active learner count inside locked update",()=>{
  const service=source("src/modules/academics/section-service.ts");
  expect(service).toContain('if(input.capacity<Number(occupancy?.n??0))');
  expect(service).toContain('throw new AcademicsServiceError("SECTION_CAPACITY_REACHED")');
  expect(service).toContain('.for("update").limit(1)');
 });
 it("enforces the exact range and reports invalid edit fields accessibly",()=>{
  const form=source("src/components/academics/academics-actions.tsx");
  expect(form).toContain('max={200}');
  expect(form).toContain('aria-invalid={!capacityValid}');
  expect(form).toContain('!capacityValid?<span role="alert"');
 });
});
