import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {
 legacyCurrentSeasonSelection,projectTpoSeasonRegistration,
 parseLegacySeasonRegistrationDeadlineIst,
} from "@/modules/placements/tpo-season-current-service";

describe("independent TPO season current vs registration state",()=>{
 const rows=[
  {id:"A",status:"CLOSED",startDate:"2025-07-01",updatedAt:"2026-01-01"},
  {id:"B",status:"ACTIVE",startDate:"2026-07-01",updatedAt:"2026-07-15"},
 ];
 it("keeps selected-current provenance distinct from active lifecycle",()=>{
  const fallback=legacyCurrentSeasonSelection(rows);
  expect(fallback.current?.id).toBe("B");
  expect(fallback.selectionSource).toBe("DERIVED_ACTIVE");
  const historical=legacyCurrentSeasonSelection(rows,["A"]);
  expect(historical.current?.id).toBe("A");
  expect(historical.selectionSource).toBe("LEGACY_IS_CURRENT");
  expect(historical.activeSeasonCount).toBe(1);
  expect(legacyCurrentSeasonSelection([]).selectionSource).toBe("NONE");
 });
 it("reads persisted managed registration rather than falsely claiming unsupported storage",()=>{
  const now=new Date("2026-10-01T00:00:00Z");
  const open=projectTpoSeasonRegistration({
   registrationControlled:true,isRegistrationOpen:true,
   registrationDeadline:"2026-11-01T00:00:00.000Z",
  },now);
  expect(open.supported).toBe(true);
  expect(open.isOpen).toBe(true);
  expect(open.deadline).toBe("2026-11-01T00:00:00.000Z");
  expect(open.requiresCohortInvitation).toBe(true);
  expect(projectTpoSeasonRegistration({
   registrationControlled:true,isRegistrationOpen:true,
   registrationDeadline:"2026-09-30T00:00:00.000Z",
  },now).isOpen).toBe(false);
  expect(projectTpoSeasonRegistration({
   registrationControlled:false,isRegistrationOpen:false,registrationDeadline:null,
  },now).isOpen).toBeNull();
  expect(open.blockedDatesSupported).toBe(false);
 });
 it("keeps source IST deadlines and never creates a season on read",()=>{
  expect(parseLegacySeasonRegistrationDeadlineIst("2026-10-01T19:00"))
   .toBe("2026-10-01T13:30:00.000Z");
  const source=readFileSync("src/modules/placements/tpo-season-current-service.ts","utf8");
  expect(source).toContain("getTpoPlacementSeasonSettings(context)");
  expect(source).toContain("projectTpoSeasonRegistration(selected.current)");
  expect(source).not.toContain("createPlacementSeason(");
 });
});
