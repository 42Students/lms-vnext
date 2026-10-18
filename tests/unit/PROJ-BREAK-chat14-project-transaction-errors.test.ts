import {describe,expect,it} from "vitest";
import {
 ProjectsServiceError,postgresConstraintName,isRetryableProjectTransactionError,
} from "@/modules/projects/errors";

const wrap=(value:unknown,n:number):unknown=>
 n===0?value:{cause:wrap(value,n-1)};

describe("Project transaction error safety for IIT Dharwad",()=>{
 it("PROJ-BREAK-MENTOR-326 only a known nested Postgres constraint value is readable",()=>{
  expect(postgresConstraintName({constraint:"project_sprints_release_sequence_uq"}))
   .toBe("project_sprints_release_sequence_uq");
  expect(postgresConstraintName(wrap({constraint:"project_resources_project_sequence_uq"},4)))
   .toBe("project_resources_project_sequence_uq");
  expect(postgresConstraintName(wrap({constraint:"too-deep"},5))).toBeNull();
  expect(postgresConstraintName({constraint:1234})).toBeNull();
  expect(postgresConstraintName({cause:"unauthorized"})).toBeNull();
 });
 it("PROJ-BREAK-MENTOR-327 serialization failure and deadlock are the only retryable SQLSTATEs",()=>{
  for(const code of ["40001","40P01"]){
   expect(isRetryableProjectTransactionError({code})).toBe(true);
   expect(isRetryableProjectTransactionError(wrap({code},5))).toBe(true);
  }
 });
 it("PROJ-BREAK-MENTOR-328 unique constraints, permissions and invalid data must never trigger retry",()=>{
  for(const code of ["23505","23503","42501","22P02","22001","08006"]){
   expect(isRetryableProjectTransactionError(wrap({code},2))).toBe(false);
  }
  expect(isRetryableProjectTransactionError(new ProjectsServiceError("PROJECT_ACCESS_DENIED")))
   .toBe(false);
 });
 it("PROJ-BREAK-MENTOR-329 malformed, cyclic and excessively wrapped errors fail closed",()=>{
  expect(isRetryableProjectTransactionError(null)).toBe(false);
  expect(isRetryableProjectTransactionError("40001")).toBe(false);
  expect(isRetryableProjectTransactionError(wrap({code:"40001"},6))).toBe(false);
  const cyclic:{cause?:unknown}={};
  cyclic.cause=cyclic;
  expect(postgresConstraintName(cyclic)).toBeNull();
  expect(isRetryableProjectTransactionError(cyclic)).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-330 string, numeric and unrelated code values are never coerced into retries",()=>{
  for(const code of [40001,40_001," 40001 ","40001x",null,undefined]){
   expect(isRetryableProjectTransactionError({code})).toBe(false);
  }
 });
});
