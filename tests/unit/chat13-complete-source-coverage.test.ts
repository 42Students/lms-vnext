import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(path,"utf8");
const expectedIds=[
  "SA-placements-projects-25",
  "SA-placements-projects-01",
  "SA-placements-projects-02",
  "SA-placements-projects-06",
  "SA-placements-projects-07",
  "SA-placements-projects-09",
  "SA-placements-projects-10",
  "SA-placements-projects-12",
  "SA-placements-projects-13",
  "SA-placements-projects-17",
  "SA-placements-projects-19",
  "SA-placements-projects-20",
  "SA-placements-projects-22",
  "SA-placements-projects-24",
  "SA-placements-projects-26",
  "SA-placements-projects-27",
  "SA-placements-projects-28",
  "SA-placements-projects-30",
  "SA-placements-projects-31",
  "SA-placements-projects-34",
  "SA-placements-projects-38",
  "SA-placements-projects-40",
  "SA-placements-projects-41",
  "SA-placements-projects-42",
  "SA-placements-projects-45",
  "SA-placements-projects-49",
  "SA-placements-projects-03",
  "SA-placements-projects-04",
  "SA-placements-projects-05",
  "SA-placements-projects-08",
  "SA-placements-projects-11",
  "SA-placements-projects-14",
  "SA-placements-projects-15",
  "SA-placements-projects-16",
  "SA-placements-projects-18",
  "SA-placements-projects-21",
  "SA-placements-projects-23",
  "SA-placements-projects-29",
  "SA-placements-projects-32",
  "SA-placements-projects-35",
  "SA-placements-projects-36",
  "SA-placements-projects-37",
  "SA-placements-projects-39",
  "SA-placements-projects-43",
  "SA-placements-projects-44",
  "SA-placements-projects-46",
  "SA-placements-projects-47",
  "SA-placements-projects-48",
  "SA-placements-projects-50",
  "SA-placements-projects-33",
  "SA-academics-people-16",
  "SA-academics-people-17",
  "SA-academics-people-18",
  "SA-academics-people-19",
  "SA-academics-people-20",
  "SA-academics-people-22",
  "SA-academics-people-29",
  "SA-academics-people-31",
  "SA-academics-people-38",
  "SA-academics-people-R02",
  "SA-academics-people-01",
  "SA-academics-people-02",
  "SA-academics-people-03",
  "SA-academics-people-04",
  "SA-academics-people-06",
  "SA-academics-people-07",
  "SA-academics-people-08",
  "SA-academics-people-09",
  "SA-academics-people-11",
  "SA-academics-people-12",
  "SA-academics-people-13",
  "SA-academics-people-15",
  "SA-academics-people-21",
  "SA-academics-people-23",
  "SA-academics-people-25",
  "SA-academics-people-28",
  "SA-academics-people-30",
  "SA-academics-people-32",
  "SA-academics-people-33",
  "SA-academics-people-41",
  "SA-academics-people-46",
  "SA-academics-people-R03",
  "SA-academics-people-R04",
  "SA-academics-people-10",
  "SA-academics-people-34",
  "SA-academics-people-35",
  "SA-academics-people-36",
  "SA-academics-people-37",
  "SA-academics-people-39",
  "SA-academics-people-40",
  "SA-academics-people-42",
  "SA-academics-people-43",
  "SA-academics-people-44",
  "SA-academics-people-45",
  "SA-academics-people-R05"
] as const;
const placementAcceptance=read("docs/audit/acceptance/superadmin-placements-projects-a-placements-verification.md");
const academicAcceptance=read("docs/audit/acceptance/superadmin-academics-people-1-academic-setup-verification.md");
const queue=read("docs/orchestrator/queues/gap-closure-chat-13.md");
const queueLines=queue.split(/\r?\n/);
const acceptedLines=(placementAcceptance+"\n"+academicAcceptance).split(/\r?\n/);
const migration=read("drizzle/0133_lanes_round_1.sql");
describe("Chat 13 final 95-gap source evidence and migration 0133 registration",()=>{
 it("SA-placements-projects-14 and SA-academics-people-16 retain exactly 95 unique queue entries",()=>{
  const rows=queueLines.filter(line=>/^\| SA-(?:placements-projects|academics-people)-/.test(line));
  expect(rows).toHaveLength(95);
  expect(rows.filter(line=>line.startsWith("| SA-placements-projects-"))).toHaveLength(50);
  expect(rows.filter(line=>line.startsWith("| SA-academics-people-"))).toHaveLength(45);
  expect(new Set(rows.map(line=>line.split("|")[1]?.trim())).size).toBe(95);
 });
 for(const id of expectedIds){
  it(id+" has a DONE queue record, DONE acceptance and a matching existing gap-named test",()=>{
   const entry=queueLines.find(line=>line.startsWith("| "+id+" |"));
   expect(entry).toBeDefined();
   expect(entry?.split("|")[4]?.trim()).toBe("DONE");
   const acceptance=acceptedLines.find(line=>line.startsWith("| "+id+" | DONE |"));
   expect(acceptance).toBeDefined();
   const paths=[...(acceptance??"").matchAll(/tests\/(?:unit|integration)\/[A-Za-z0-9._\-/]+\.test\.ts/g)].map(x=>x[0]);
   expect(paths.length).toBeGreaterThan(0);
   expect(paths.some(path=>read(path).includes(id))).toBe(true);
  });
 }
 const registered=[
  {id:"SA-placements-projects-14",path:"docs/proposed-migrations/registered-0133/chat13-placement-legacy-posting-details.sql"},
  {id:"SA-placements-projects-05",path:"docs/proposed-migrations/registered-0133/superadmin-placement-offer-letter.sql"},
  {id:"SA-placements-projects-21",path:"docs/proposed-migrations/registered-0133/superadmin-placement-offer-letter.sql"},
  {id:"SA-placements-projects-24",path:"docs/proposed-migrations/registered-0133/superadmin-placements-company-verification.sql"},
  {id:"SA-placements-projects-26",path:"docs/proposed-migrations/registered-0133/superadmin-placements-company-global-edit.sql"},
  {id:"SA-placements-projects-27",path:"docs/proposed-migrations/registered-0133/superadmin-company-domains-aliases.sql"},
  {id:"SA-placements-projects-28",path:"docs/proposed-migrations/registered-0133/superadmin-company-domains-aliases.sql"},
 ] as const;
 for(const {id,path} of registered){
  it(id+" migration proposal is present in numbered 0133 without omitting statements",()=>{
   const statements=read(path).split(/\r?\n/).filter(line=>line.trim()&&!line.trim().startsWith("--"));
   expect(statements.length).toBeGreaterThan(0);
   for(const statement of statements)expect(migration).toContain(statement);
  });
 }
});
