import {describe,expect,it,vi} from "vitest";
import {listFacultyCourseCardSummaries} from "@/modules/courses/faculty-course-card-summary-service";
import type {listFacultyCourseDeliveries} from "@/modules/courses/faculty-course-service";

vi.mock("server-only",()=>({}));
const getDb=vi.hoisted(()=>vi.fn());
vi.mock("@/db/client",()=>({getDb}));

type Assigned=Awaited<ReturnType<typeof listFacultyCourseDeliveries>>[number];
describe("Faculty progressive course card summary",()=>{
 it("keeps every authorized course beyond the old silent 100-card cap",async()=>{
  const paths=vi.fn().mockResolvedValue([]);
  getDb.mockReturnValue({
   select:()=>({from:()=>({where:()=>({orderBy:paths})})}),
  });
  const assigned=Array.from({length:144},(_,i)=>({
   deliveryId:"delivery-"+i,offeringId:"offering-"+i,
  })) as unknown as Assigned[];
  const results=await listFacultyCourseCardSummaries(assigned);
  expect(results.size).toBe(144);
  expect(results.has("delivery-99")).toBe(true);
  expect(results.has("delivery-100")).toBe(true);
  expect(results.has("delivery-143")).toBe(true);
  expect(results.get("delivery-143")?.summary).toMatchObject({
   contents:0,assignments:0,quizzes:0,draftItems:0,
  });
  expect(paths).toHaveBeenCalledTimes(1);
 });
});
