import {describe,expect,it} from "vitest";
import {
  isArchivableProjectResourceStatus,
  isArchivedResourceRestoreOnly,
} from "@/modules/projects/mentor-resource-state-transition-model";

describe("resource archive and restore state policy",()=>{
 it("archives both active and draft resources, but never repeats a tombstone",()=>{
  expect(isArchivableProjectResourceStatus("ACTIVE")).toBe(true);
  expect(isArchivableProjectResourceStatus("DRAFT")).toBe(true);
  expect(isArchivableProjectResourceStatus("ARCHIVED")).toBe(false);
  expect(isArchivableProjectResourceStatus("DELETED")).toBe(false);
 });
 it("restores an archived resource only with a valid write version and ACTIVE status",()=>{
  expect(isArchivedResourceRestoreOnly({
   status:"ACTIVE",expectedUpdatedAt:"2026-10-24T10:00:00.000Z",
  })).toBe(true);
  expect(isArchivedResourceRestoreOnly({status:"ACTIVE"})).toBe(false);
  expect(isArchivedResourceRestoreOnly({
   status:"DRAFT",expectedUpdatedAt:"2026-10-24T10:00:00.000Z",
  })).toBe(false);
  expect(isArchivedResourceRestoreOnly({
   status:"ARCHIVED",expectedUpdatedAt:"2026-10-24T10:00:00.000Z",
  })).toBe(false);
 });
 it("blocks the archived-restore endpoint from changing project resource metadata",()=>{
  const token="2026-10-24T10:00:00.000Z";
  for(const extra of [
   {title:"Changed during restore"},
   {visibility:"TEAM"},
   {url:"https://example.com/unapproved"},
   {sprintId:null},
   {pinned:true},
  ]){
   expect(isArchivedResourceRestoreOnly({
    status:"ACTIVE",expectedUpdatedAt:token,...extra,
   })).toBe(false);
  }
 });
});
