import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
describe("TPO-home-R04 urgent decision ordering",()=>{
 it("TPO-home-R04 ranks team asks before low-priority operational work",()=>{
  const cards=buildTpoLegacyNextUp({needsYou:[
   {type:"TEAM_ASKS",priority:1,title:"Answer your team",count:2,link:"/tpo/team"},
   {type:"EVALUATION_PLAN_MISSING",priority:3,title:"Create an evaluation plan",count:1,link:"/tpo/placements"},
  ],batches:[],checklist:[]});
  expect(cards?.title).toBe("Answer your team");
  expect(cards?.action).toBe("See what you were asked");
 });
 it("TPO-home-R04 uses persisted queue urgency rather than fixed all-team priority four",()=>{
  const page=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/home/page.tsx"),"utf8");
  expect(page).toContain('type:"TEAM_ASKS",priority:1');
  expect(page).toContain('teamAsks+" team asks for you"');
  expect(page).toContain('{type:"REQUESTS",priority:1');
 });
});
