import {describe,expect,it} from "vitest";
import {
 tpoConfigVersionSchema,hasCurrentTpoConfigVersion,
 tpoJobTypeNameSchema,tpoBlockedDaySchema,
} from "@/modules/placements/tpo-configuration-model";

describe("TPO-settings-audit-CONFIG-01 canonical config and date inputs",()=>{
 it("requires a valid offset-aware CAS token, matching persisted version to millisecond precision",()=>{
  const token="2026-10-18T18:00:00.123+05:30";
  const when=new Date(token);
  expect(tpoConfigVersionSchema.safeParse(token).success).toBe(true);
  expect(hasCurrentTpoConfigVersion(when,when.toISOString())).toBe(true);
  expect(hasCurrentTpoConfigVersion(when,"2026-10-18T18:00:00.124+05:30")).toBe(false);
  expect(hasCurrentTpoConfigVersion(undefined,"none")).toBe(true);
  expect(hasCurrentTpoConfigVersion(undefined,token)).toBe(false);
  for(const invalid of ["2026-10-18","yesterday","", "2026-10-18T18:00:00"]){
   expect(tpoConfigVersionSchema.safeParse(invalid).success,invalid).toBe(false);
  }
 });
 it("allows bounded multilingual job-type names, not markup/newlines or oversized fields",()=>{
  for(const accepted of ["Internship","Full-Time (PPO)","Software / R&D","ఇంటర్న్"]){
   expect(tpoJobTypeNameSchema.safeParse(accepted).success,accepted).toBe(true);
  }
  for(const invalid of [" ","x","a".repeat(41),"<script>","Sales\nAdmin","<img src=x>"]){
   expect(tpoJobTypeNameSchema.safeParse(invalid).success,invalid).toBe(false);
  }
 });
 it("keeps placement blocked days as real ISO calendar dates without accidental timestamp shifts",()=>{
  expect(tpoBlockedDaySchema.safeParse("2026-10-18").success).toBe(true);
  expect(tpoBlockedDaySchema.safeParse("2024-02-29").success).toBe(true);
  for(const invalid of ["2026-02-29","2026-13-01","2026-10-18T00:00:00Z","18-10-2026","2026-1-8"]){
   expect(tpoBlockedDaySchema.safeParse(invalid).success).toBe(false);
  }
 });
});
