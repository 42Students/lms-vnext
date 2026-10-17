import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {projectTpoBatchNextStep} from "@/modules/placements/tpo-batch-next-step-state-model";
const src=(file:string)=>readFileSync(file,"utf8");
describe("Chat5 next batch states",()=>{
 it("TPO-batches-17 renders accessible batch card skeleton and retry without falsely reporting changed decisions",()=>{
  const loading=src("src/app/(authenticated)/tpo/batches/loading.tsx");
  const failure=src("src/app/(authenticated)/tpo/batches/error.tsx");
  expect(loading).toContain('aria-busy="true"');
  expect(loading).toContain("animate-pulse");
  expect(failure).toContain("Couldn&apos;t refresh batches");
  expect(failure).toContain("No eligibility decisions were changed.");
  expect(failure).toContain('onClick={reset}>Retry');
 });
 it("TPO-batches-49 suggests a reminder only while eligible learner choices remain and registration is open",()=>{
  const now=new Date("2099-01-10T04:00:00.000Z");
  const base={finished:false,activeLearners:50,eligible:35,undecided:0,invited:true,
   deadline:new Date("2099-01-31T18:29:00.000Z"),invitable:6,registered:29};
  expect(projectTpoBatchNextStep(base,now).button).toBe("Remind or move deadline");
  expect(projectTpoBatchNextStep({...base,invitable:0,registered:35},now).button).toBe("Continue on Students");
  expect(projectTpoBatchNextStep({...base,finished:true},now).button).toBe("Review history");
  const page=src("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(page).toContain('next.button==="Remind or move deadline"');
  expect(page).toContain("Suggested: remind them to register");
  expect(page).toContain('href="#batch-reminder"');
 });
});
