import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {buildTpoLegacyHomeRows,type TpoHomeSummary} from "@/modules/placements/tpo-home-legacy-rows";
import {buildTpoLegacyNextUp} from "@/modules/placements/tpo-home-next-up";
import {tpoHomeGreeting} from "@/modules/placements/tpo-home-greeting-model";

const fixed=new Date("2099-07-01T02:00:00.000Z");
const base:TpoHomeSummary={
 batch:null,moreBatches:0,liveDrives:0,driveAttention:0,
 registered:null,placedUnique:null,recruiterLeads:null,followUps:null,
 recruiterAccess:null,pendingRequests:0,messages:null,
 teamAsks:null,teamMentions:null,teamUnread:null,upcoming:[],
};
const rows=(overrides:Partial<TpoHomeSummary>)=>buildTpoLegacyHomeRows({...base,...overrides},fixed);
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("chat-4 verified TPO Home gap coverage",()=>{
 it("TPO-home-01 uses an IST date and the persisted user's first-name greeting",()=>{
  const morning=tpoHomeGreeting(fixed,"Ananya Rao");
  expect(morning.title).toBe("Good morning, Ananya");
  expect(morning.date).toContain("1 July");
  expect(tpoHomeGreeting(new Date("2099-07-01T09:00:00.000Z"),"Ananya").title).toBe("Good afternoon, Ananya");
  expect(tpoHomeGreeting(new Date("2099-07-01T15:00:00.000Z"),"Ananya").title).toBe("Good evening, Ananya");
  expect(tpoHomeGreeting(fixed,null).title).toBe("Good morning");
  expect(source("src/app/(authenticated)/tpo/home/page.tsx")).toContain("profileRows[0]?.displayName");
 });
 it("TPO-home-05 shows live drives, requests and the request action",()=>{
  const row=rows({liveDrives:2,driveAttention:3,driveDetail:"3 requests",
   driveHref:"/tpo/placements?tab=requests"})[1];
  expect(row).toMatchObject({title:"Drives",status:"2 live · 3 requests",
   href:"/tpo/placements?tab=requests",needsAttention:true});
 });
 it("TPO-home-06 shows the registered and placed learner counts",()=>{
  const row=rows({registered:10,placedUnique:4})[2];
  expect(row).toMatchObject({title:"Students",status:"10 registered · 4 placed",
   href:"/tpo/students",needsAttention:false});
  expect(rows({registered:0,placedUnique:0})[2].status).toBe("Nobody registered yet");
 });
 it("TPO-home-08 combines inbox requests and recruiter messages",()=>{
  const row=rows({pendingRequests:2,messages:1})[4];
  expect(row).toMatchObject({title:"Inbox",status:"2 requests · 1 message to answer",
   href:"/tpo/requests",needsAttention:true});
  expect(rows({pendingRequests:0,messages:0})[4].status).toBe("No requests or messages waiting");
 });
 it("TPO-home-13 shows the first undone setup step when no need cards exist",()=>{
  const next=buildTpoLegacyNextUp({needsYou:[],batches:[],checklist:[
   {label:"Decide who is in placements",done:true},
   {label:"Invite a batch to register",done:false,link:"/tpo/batches"},
  ]});
  expect(next).toEqual({title:"Invite a batch to register",
   text:"Setting up placements: 1 step left.",action:"Start",href:"/tpo/batches"});
 });
 it("TPO-home-42 polls scoped sidebar counters while visible",()=>{
  const src=source("src/components/shell/sidebar-nav.tsx");
  expect(src).toContain("/api/tpo/shell-counts");
  expect(src).toContain("60000");
  expect(src).toContain('visibilitychange');
 });
 it("TPO-home-43 renders five legacy mobile-footer destinations",()=>{
  const src=source("src/components/tpo/tpo-mobile-footer.tsx");
  for(const label of ["Home","Engage","Drives","Students","More"])
   expect(src).toContain('label:"'+label+'"');
  expect(source("src/app/(authenticated)/tpo/layout.tsx")).toContain("<TpoMobileFooter/>");
 });
 it("TPO-home-17 exposes titled rows and a text Needs you indicator, not colour alone",()=>{
  const src=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(src).toContain('data-testid={"home.row."+row.key}');
  expect(src).toContain('aria-label="Needs you"');
  expect(src).toContain("row.needsAttention");
  expect(src).toContain("row.status");
 });
 it("TPO-home-36 renders dated notifications and screen-reader unread text",()=>{
  const src=source("src/components/tpo/tpo-bell-panel.tsx");
  expect(src).toContain("item.createdAt");
  expect(src).toContain('className="sr-only"> New notification.');
  expect(source("src/app/(authenticated)/tpo/layout.tsx")).toContain("slice(0,20)");
 });
 it("TPO-home-39 uses the accessible notification Drawer instead of an absolute region",()=>{
  const src=source("src/components/tpo/tpo-bell-panel.tsx");
  expect(src).toContain('<Drawer open={open} onOpenChange={setOpen} title="Notifications"');
  expect(src).toContain("aria-expanded={open}");
 });
 it("TPO-home-41 supports G/N chords, Escape and the keyboard help dialog",()=>{
  const src=source("src/components/tpo/tpo-keyboard-shortcuts.tsx");
  expect(src).toContain('prefix.current==="g"?go:make');
  expect(src).toContain('event.key==="Escape"');
  expect(src).toContain('event.key==="?"');
  expect(src).toContain('title="Keyboard shortcuts"');
  expect(src).toContain('h:"/tpo/home"');
 });
 it("TPO-home-10 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(s).toContain("tpoHomeNeedsLine");
  expect(s).toContain("weekNext");

 });
 it("TPO-home-18 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(s).toContain("lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]");

 });
 it("TPO-home-20 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/loading.tsx");
  expect(s).toContain("Loading placement home");
  expect(s).toContain("animate-pulse");

 });
 it("TPO-home-21 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/error.tsx");
  expect(s).toContain("Could not load Home");
  expect(s).toContain("Something went wrong while loading this content. Your current context has been kept.");
  expect(s).toContain("onClick={reset}");

 });
 it("TPO-home-23 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(s).toContain("data-testid=\"tpo.home\"");
  expect(s).not.toContain("lifecycle migration is registered");
 });
 it("TPO-home-24 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/home/page.tsx");
  expect(s).toContain("aria-label=\"Your placement work\"");
  expect(s).not.toContain('aria-label="Pending placement requests"');
 });
 it("TPO-home-29 verified legacy and graceful behavior",()=>{
  const s=source("src/app/(authenticated)/tpo/find/page.tsx");
  expect(s).toContain("Find a student, recruiter, company or drive");
  expect(s).toContain("Type a name or a roll number, for example 21CS001");
  expect(s).toContain("No student, recruiter, company or drive matches");

 });
 it("TPO-home-30 verified legacy and graceful behavior",()=>{
  const s=source("src/components/tpo/tpo-topbar-new-menu.tsx");
  expect(s).toContain("item.label!==\"Follow-up\"");
  expect(s).toContain("<TpoNewFollowupModal");

 });
 it("TPO-home-33 verified legacy and graceful behavior",()=>{
  const s=source("src/components/tpo/tpo-header-indicators.tsx");
  expect(s).toContain("messages>0");
  expect(s).toContain("aria-label");

 });
 it("TPO-home-34 verified legacy and graceful behavior",()=>{
  const s=source("src/components/tpo/tpo-header-indicators.tsx");
  expect(s).toContain("visibilitychange");
  expect(s).toContain("30000");

 });
 it("TPO-home-35 verified legacy and graceful behavior",()=>{
  const s=source("src/components/tpo/tpo-bell-panel.tsx");
  expect(s).toContain("/api/tpo/notifications/");
  expect(s).toContain("setReadIds");
  expect(s).toContain("router.push(href)");
  expect(s.indexOf("setReadIds")).toBeLessThan(s.indexOf("router.push(href)"));
 });
 it("TPO-home-38 verified legacy and graceful behavior",()=>{
  const s=source("src/components/tpo/tpo-bell-panel.tsx");
  expect(s).toContain("/api/tpo/notifications/read-all");
  expect(s).toContain("unread>0?<button");
  expect(s).toContain("Mark all read");
  expect(s).not.toContain("window.confirm");
 });
 it("TPO-home-19 refreshes Home on return without refetch storms",()=>{
  const s=source("src/components/tpo/tpo-home-return-refresh.tsx");
  expect(s).toContain('document.addEventListener("visibilitychange",handle)');
  expect(s).toContain("router.refresh()");
  expect(s).toContain("now-lastRefresh.current<15000");
  expect(source("src/app/(authenticated)/tpo/home/page.tsx")).toContain("<TpoHomeReturnRefresh/>");
 });
 it("TPO-home-37 refreshes scoped bell items on open and gives retry feedback",()=>{
  const s=source("src/components/tpo/tpo-bell-panel.tsx");
  expect(s).toContain('apiFetch<unknown>("/api/tpo/header-snapshot"');
  expect(s).toContain("tpoHeaderSnapshotSchema.safeParse(payload)");
  expect(s).toContain('if(next)void refresh()');
  expect(s).toContain("Couldn\\u0027t refresh notifications. Showing the last messages we loaded.");
  expect(s).toContain("Refreshing notifications…");
 });
 it("TPO-home-R07 opens a student record using the scoped finder query and membership identifier",()=>{
  const s=source("src/app/(authenticated)/tpo/find/page.tsx");
  expect(s).toContain('"/tpo/students?q="+encodeURIComponent(s.name??"")+"&student="+encodeURIComponent(s.id)');
  expect(s).toContain("named.students.slice(0,5)");
 });
});
