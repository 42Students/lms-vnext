import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoTeamAwaySchema} from "@/modules/placements/tpo-team-away-service";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO Team away until",()=>{
 it("TPO-inbox-team-34 validates time and uses only the active scoped member for writes",()=>{
  expect(tpoTeamAwaySchema.safeParse({until:"2099-07-01T12:30:00+05:30",expectedUntil:null}).success).toBe(true);
  expect(tpoTeamAwaySchema.safeParse({until:"yesterday",expectedUntil:null}).success).toBe(false);
  const service=src("src/modules/placements/tpo-team-away-service.ts");
  expect(service).toContain("member.id");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("365*86400000");
  expect(service).toContain("TEAM_AWAY_STALE");
  expect(src("docs/proposed-migrations/tpo-inbox-team-away-until.sql")).toContain("tpo_team_away_membership_college_fk");
 });
 it("TPO-inbox-team-31 displays verified away intervals and a Back now action only for the member",()=>{
  const page=src("src/app/(authenticated)/tpo/team/page.tsx");
  const form=src("src/components/tpo/tpo-team-away-form.tsx");
  expect(page).toContain("awayByMember.get(member.membershipId)");
  expect(page).toContain("member.membershipId===context.membership?.id&&awayState?.ready");
  expect(form).toContain("Back now");
  expect(form).toContain("timeoutMs:12000");
  expect(src("src/app/api/placements/tpo/team/away/route.ts")).toContain("isSameOriginRequest(request)");
 });
});
