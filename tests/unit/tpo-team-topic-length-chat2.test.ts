import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {internalThreadSchema} from "@/modules/placements/tpo-team-internal-model";

const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const recipientMembershipId="11111111-1111-4111-8111-111111111111";

describe("TPO Team legacy topic limits",()=>{
 it("TPO-inbox-team-17 accepts exactly 200 characters and rejects 201",()=>{
  const base={recipientMembershipId};
  expect(internalThreadSchema.safeParse({...base,topic:"t".repeat(200)}).success).toBe(true);
  expect(internalThreadSchema.safeParse({...base,topic:"t".repeat(201)}).success).toBe(false);
  expect(internalThreadSchema.safeParse({...base,topic:"   "}).success).toBe(false);
 });
 it("TPO-inbox-team-17 aligns form and persisted topic length without altering recruiter messaging",()=>{
  expect(source("src/components/tpo/tpo-team-forms.tsx")).toContain("maxLength={200}");
  expect(source("src/db/schema/tpo-internal.ts")).toContain('topic: varchar("topic", { length: 200 })');
  expect(source("drizzle/0133_lanes_round_1.sql")).toContain("TYPE varchar(200)");
 });
});
