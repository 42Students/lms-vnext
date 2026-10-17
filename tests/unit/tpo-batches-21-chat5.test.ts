import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {projectTpoBatchNextStep,type TpoBatchNextStepFacts} from "@/modules/placements/tpo-batch-next-step-state-model";
const now=new Date("2099-06-01T10:00:00Z");
const initial:TpoBatchNextStepFacts={finished:false,activeLearners:20,eligible:15,undecided:0,
 invited:false,deadline:null,invitable:15,registered:0};
const source=(p:string)=>readFileSync(p,"utf8");
describe("TPO batch next step parity",()=>{
 it("TPO-batches-21 covers every honest next-step state and active registration action",()=>{
  const project=(changes:Partial<TpoBatchNextStepFacts>)=>projectTpoBatchNextStep({...initial,...changes},now);
  expect(project({finished:true}).title).toBe("This batch is finished");
  expect(project({activeLearners:0}).title).toBe("No students yet");
  expect(project({eligible:0}).title).toBe("Decide who is in placements");
  expect(project({undecided:3}).button).toBe("Decide learners");
  expect(project({eligible:null}).title).toBe("Review incomplete eligibility");
  expect(project({}).title).toContain("Invite 15 eligible students");
  expect(project({invited:true,deadline:new Date("2099-05-01T10:00:00Z")}).title).toContain("Registration closed");
  expect(project({invited:true,deadline:new Date("2099-06-15T10:00:00Z")}).title).toContain("Registration is open");
  expect(project({invited:true,invitable:0}).title).toBe("Everyone has chosen already");
  const ui=source("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(ui).toContain('id="batch-next-step"');
  expect(ui).toContain("projectTpoBatchNextStep");
  expect(ui).toContain("next.title");
  expect(ui).toContain("next.button");
 });
 it("TPO-batches-49 points suggestions at real reviewed actions without silent writes",()=>{
  const ui=source("src/app/(authenticated)/tpo/batches/[batchId]/page.tsx");
  expect(ui).toContain('data-testid="batch.suggest"');
  expect(ui).toContain("Suggested: make them eligible");
  expect(ui).toContain("Suggested: invite the batch");
  expect(ui).toContain('href="#batch-next-step"');
  expect(ui).toContain(">Show me</Link>");
  expect(ui).toContain(">Do it</Link>");
 });
});
