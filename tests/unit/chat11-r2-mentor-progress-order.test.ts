import {expect,it} from "vitest";
import {compareMentorProjectsByProgress,compareMentorProjectsByMostProgress} from "@/modules/projects/mentor-project-order-model";
const a={id:"a",title:"Active Alpha",status:"ACTIVE",updatedAt:new Date("2026-10-15T10:00:00Z")};
const b={id:"b",title:"Active Beta",status:"ACTIVE",updatedAt:new Date("2026-10-14T10:00:00Z")};
it("sorts impossible or non-finite completion values after measured project progress",()=>{
 expect(compareMentorProjectsByProgress(a,b,Number.NaN,45)).toBeGreaterThan(0);
 expect(compareMentorProjectsByMostProgress(a,b,Number.POSITIVE_INFINITY,45)).toBeGreaterThan(0);
 expect(compareMentorProjectsByMostProgress(a,b,-1,45)).toBeGreaterThan(0);
});
it("keeps archived work behind active projects and deterministic measured ties",()=>{
 expect(compareMentorProjectsByProgress({...a,status:"ARCHIVED"},b,95,5)).toBeGreaterThan(0);
 expect(compareMentorProjectsByMostProgress(a,b,50,50)).toBeLessThan(0);
});
