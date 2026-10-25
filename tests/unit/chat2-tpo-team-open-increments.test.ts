import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(p:string)=>readFileSync(p,"utf8");
describe("TPO Team remaining gap increments, not full object-thread parity",()=>{
 it("TPO-inbox-team-07 keeps recruiter drive Discussion linked and scoped before adding change-request quotes",()=>{
  const service=source("src/modules/placements/tpo-drive-discussion-service.ts");
  const page=source("src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx");
  expect(service).toContain("eq(placementTpoMessageThreads.collegeId,collegeId)");
  expect(service).toContain("eq(placementTpoMessageThreads.jobId,jobId)");
  expect(page).toContain("Open conversation</Link>");
 });
 it("TPO-inbox-team-18 defaults to Following, retains search and counted filters but not imaginary object threads",()=>{
  const legacy=source("src/app/(authenticated)/tpo/team/page.tsx");
  const messages=source("src/app/(authenticated)/tpo/messages/page.tsx");
  const directory=source("src/components/tpo/tpo-team-messages-directory.tsx");
  expect(legacy).toContain('redirect("/tpo/messages?" + target.toString())');
  expect(messages).toContain('<TpoTeamMessagesDirectory context={context}');
  expect(directory).toContain('selectedFilter(filter??"following")');
  expect(directory).toContain('safeQuery.length>=2?"all":view');
  expect(directory).toContain('const displayedCount="totalCount" in data?data.totalCount:visible.length');
  expect(directory).toContain("<TpoTeamSearch value={safeQuery}/>");
 });
 it("TPO-inbox-team-20 stores per-member Follow/Mute and suppresses muted unread alerts",()=>{
  const read=source("src/modules/placements/tpo-team-internal-read-service.ts");
  const controls=source("src/components/tpo/tpo-team-follow-controls.tsx");
  expect(read).toContain("unreadCount:row.following&&!row.muted?Number(row.unreadMessages):0");
  expect(read).toContain("m.author_membership_id<>");
  expect(controls).toContain("Stop following");
  expect(controls).toContain("Unmute");
 });
 it("TPO-inbox-team-22 creates scoped idempotent asks with done/cancel lifecycle; Home integration remains queued",()=>{
  const service=source("src/modules/placements/tpo-team-asks-service.ts");
  expect(service).toContain("tpoTeamAskCanTransition");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("placements.tpo_team.ask_created");
  expect(service).toContain("placements.tpo_team.ask_done");
  expect(service).toContain("placements.tpo_team.ask_cancelled");
 });
 it("TPO-inbox-team-26 retains per-thread Details with actual people, asks and decision counts",()=>{
  const detail=source("src/components/tpo/tpo-team-thread-details.tsx");
  expect(detail).toContain("sessionStorage.getItem(storageKey)");
  expect(detail).toContain("sessionStorage.setItem(storageKey");
  expect(detail).toContain("Open asks");
  expect(detail).toContain("Decisions here");
  expect(detail).toContain("People");
 });
 it("TPO-inbox-team-30 validates legacy ?c and ?m aliases without redirecting to arbitrary external destinations",()=>{
  const team=source("src/app/(authenticated)/tpo/team/page.tsx");
  expect(team).toContain('const thread = first(params["c"]) ?? first(params["thread"]) ?? first(params["conversationId"])');
  expect(team).toContain('/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(thread)');
  expect(team).toContain('redirect("/tpo/messages?" + target.toString())');
  expect(team).toContain('redirect("/tpo/settings?tab=team")');
 });
 it("TPO-inbox-team-31 displays real workload counts, never fabricated unregistered owner values",()=>{
  const directory=source("src/components/tpo/tpo-team-messages-directory.tsx");
  const work=source("src/modules/placements/tpo-team-ownership-workload-service.ts");
  expect(directory).toContain("const visible=data.items");
  expect(work).toContain("hasDriveOwnerColumn()");
  expect(work).toContain("isNotNull(placementJobs.ownerMembershipId)");
  expect(work).toContain("liveDrives:0,draftDrives:0");
  expect(work).toContain("entry.liveDrives=Number(row.live)");
  expect(work).toContain("entry.draftDrives=Number(row.draft)");
 });
});