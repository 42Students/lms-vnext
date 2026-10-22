import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";

const read=(path:string)=>readFileSync(path,"utf8");
const UI="src/components/placements/learner-jobs-browse.tsx";
describe("LEARNER-placements-19 — reviewer correction: no 20-item pagination gap",()=>{
 it("LEARNER-placements-19 pages 20 authorized, filtered role results per page, not 20 cards per section",()=>{
  const roles=Array.from({length:47},(_,i)=>({id:i+1}));
  const page1=learnerDrivePageState(roles.length,1);
  const page2=learnerDrivePageState(roles.length,2);
  const page3=learnerDrivePageState(roles.length,3);
  expect(roles.slice(page1.startIndex,page1.endIndex)).toHaveLength(20);
  expect(roles.slice(page2.startIndex,page2.endIndex)).toHaveLength(20);
  expect(roles.slice(page3.startIndex,page3.endIndex)).toHaveLength(7);
  expect([page1,page2,page3].map(p=>p.firstNumber)).toEqual([1,21,41]);
  expect([page1,page2,page3].map(p=>p.lastNumber)).toEqual([20,40,47]);
  expect(page3.totalPages).toBe(3);
 });
 it("LEARNER-placements-19 recalculates after filtering and recovers a stale URL page without leaking items",()=>{
  const before=learnerDrivePageState(41,3);
  const after=learnerDrivePageState(9,3);
  expect(before).toMatchObject({page:3,startIndex:40,endIndex:41});
  expect(after).toMatchObject({page:1,startIndex:0,endIndex:9,totalPages:1,recovered:true});
  expect(learnerDrivePageState(0,5)).toMatchObject({page:1,firstNumber:0,lastNumber:0,totalPages:1});
  expect(learnerDrivePageState(20,1)).toMatchObject({page:1,endIndex:20,totalPages:1});
  expect(learnerDrivePageState(21,2)).toMatchObject({page:2,startIndex:20,endIndex:21,totalPages:2});
 });
 it("LEARNER-placements-19 binds the 20-item limit to the live filter and page controls",()=>{
  const ui=read(UI);
  expect(ui).toContain("const PAGE_SIZE = 20;");
  expect(ui).toContain("filterLearnerPlacementJobs(matchingItems,filters,Date.parse(snapshotNowIso))");
  // The currently rendered availability subset, not an inaccessible drive,
  // determines the page count.
  expect(ui).toContain("learnerDrivePageState(primary.length,parsedPage,PAGE_SIZE)");
  expect(ui).toContain("const paged=primary.slice(pagination.startIndex,pagination.endIndex)");
  expect(ui).toContain('aria-label="Drive results pages"');
  expect(ui).toContain("Showing page {page} instead.");
  expect(ui).toContain('totalPages > 1');
 });
});
