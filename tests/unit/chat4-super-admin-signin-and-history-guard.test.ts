import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 collegeAdminHistoryCsv,MAX_ADMIN_HISTORY_EXPORT_ROWS,
} from "@/modules/colleges/admin-history-export-model";
import {signInPolicyReadState} from "@/modules/colleges/signin-policy-read-model";
import {signInCapabilities,collegeSignInMethodSchema,updateCollegeSignInSchema} from "@/modules/colleges/signin-methods-model";

describe("Super Admin sign-in safety and admin activity CSV disclosure",()=>{
 it("SA-tenants-signin-READ-01 distinguishes missing migration/policy, invalid stored modes and supported methods",()=>{
  expect(signInPolicyReadState(false,null)).toEqual({kind:"MIGRATION_PENDING",method:null});
  expect(signInPolicyReadState(true,null)).toEqual({kind:"NOT_CONFIGURED",method:null});
  expect(signInPolicyReadState(true,"unsafe-custom-provider")).toEqual({kind:"INVALID_POLICY",method:null});
  for(const method of collegeSignInMethodSchema.options){
   expect(signInPolicyReadState(true,method)).toEqual({kind:"CONFIGURED",method});
  }
  expect(signInCapabilities("EMAIL_ONLY")).toEqual({email:true,phone:false,primary:"EMAIL"});
  expect(signInCapabilities("PHONE_ONLY")).toEqual({email:false,phone:true,primary:"PHONE"});
  expect(signInCapabilities("PHONE_AND_EMAIL")).toEqual({email:true,phone:true,primary:"PHONE"});
  expect(signInCapabilities("EMAIL_AND_PHONE")).toEqual({email:true,phone:true,primary:"EMAIL"});
 });
 it("SA-tenants-signin-CAS-01 strict command blocks unconfirmed tenant/version or unknown policy fields",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(updateCollegeSignInSchema.safeParse({
   collegeId:id,method:"PHONE_ONLY",expectedVersion:0,
  }).success).toBe(true);
  for(const input of [
   {collegeId:"not-a-uuid",method:"PHONE_ONLY",expectedVersion:0},
   {collegeId:id,method:"ALL",expectedVersion:0},
   {collegeId:id,method:"PHONE_ONLY",expectedVersion:-1},
   {collegeId:id,method:"PHONE_ONLY",expectedVersion:1.5},
   {collegeId:id,method:"PHONE_ONLY",expectedVersion:0,otherCollege:"forged"},
  ])expect(updateCollegeSignInSchema.safeParse(input).success).toBe(false);
  const source=readFileSync("src/modules/colleges/admin-signin-policy-service.ts","utf8");
  const read=source.slice(source.indexOf("export async function readAdminCollegeSignInPolicy("),
   source.indexOf("export class CollegeSignInPolicyError"));
  expect(read).toContain("getDb().transaction(async tx=>");
  expect(read).toContain('assertPersistedPlatformPermission(tx,context,"college.read"');
  expect(read.indexOf("assertPersistedPlatformPermission")).toBeLessThan(read.indexOf("tx.execute"));
  const write=source.slice(source.indexOf("export async function saveAdminCollegeSignInPolicy("));
  const role=write.indexOf('assertPersistedPlatformPermission(tx,context,"college.manage"');
  const idempotent=write.indexOf("if(current?.method===input.method)");
  const conflict=write.indexOf('throw new CollegeSignInPolicyError("SIGNIN_POLICY_STALE")');
  const audit=write.indexOf("tx.insert(activityEvents)");
  expect(role).toBeGreaterThan(-1);
  expect(idempotent).toBeGreaterThan(role);
  expect(conflict).toBeGreaterThan(idempotent);
  expect(audit).toBeGreaterThan(conflict);
 });
 it("SA-tenants-admin-history-CSV-01 emits formula-safe IST events with an explicit 100-entry export ceiling",()=>{
  expect(MAX_ADMIN_HISTORY_EXPORT_ROWS).toBe(100);
  const date=new Date("2026-10-18T00:00:00Z");
  const rows=Array.from({length:101},(_,i)=>({occurredAt:date,eventType:"IDENTITY",summary:"Audit "+i}));
  rows[0]!.summary='=HYPERLINK("https://bad.example","click")';
  rows[1]!.summary="-1";
  const csv=collegeAdminHistoryCsv(rows);
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  expect(csv).toContain("When (IST)");
  expect(csv).toContain('"\'=HYPERLINK(');
  expect(csv).toContain('"\'-1"');
  expect(csv).toContain('"EXPORT TRUNCATED"');
  expect(csv).toContain('"Audit 99"');
  expect(csv).not.toContain('"Audit 100"');
  expect(collegeAdminHistoryCsv(rows.slice(0,1))).not.toContain("EXPORT TRUNCATED");
 });
});
