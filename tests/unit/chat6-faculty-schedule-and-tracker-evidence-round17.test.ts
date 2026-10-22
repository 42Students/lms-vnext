import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(path:string)=>readFileSync(path,"utf8");

describe("chat-6 source-evidence gaps",()=>{
  it("FAC-attendance-grades-R02 constrains faculty schedules to owned delivery, academic period, conflicts and marked-session lock",()=>{
    const service=src("src/modules/attendance/faculty-schedule-mutation-service.ts");
    expect(service).toContain("hasActiveMembership(context)");
    expect(service).toContain('hasMembershipRole(context,"FACULTY")');
    expect(service).toContain("listFacultyCourseDeliveries(context)");
    expect(service).toContain('owned.academicPeriodStatus==="CLOSED"');
    expect(service).toContain("periodStartDate");
    expect(service).toContain("periodEndDate");
    expect(service).toContain("pg_advisory_xact_lock");
    expect(service).toContain('marked?.status==="MARKED"');
    expect(service).toContain('eq(sectionScheduleEvents.status,"SCHEDULED")');
    expect(service).toContain('throw new CoursesServiceError("SCHEDULE_EVENT_CONFLICT")');
    // Historical scheduling (within the academic period) remains a product
    // decision; this source test does not assert an absent grace-period rule.
  });
  it("SA-placements-projects-102 mounts authenticated Alt+B report drawer with captured page/browser/viewport context",()=>{
    const launcher=src("src/components/tracker/tracker-quick-report-launcher.tsx");
    const shell=src("src/components/shell/app-shell.tsx");
    expect(launcher).toContain('event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.repeat&&event.key.toLowerCase()==="b"');
    expect(launcher).toContain("event.preventDefault()");
    expect(launcher).toContain('<Drawer open={open} onOpenChange={setOpen} title="Report an issue"');
    expect(launcher).toContain('closest("input,textarea,select,[contenteditable=true]")');
    expect(launcher).toContain("window.location.pathname+window.location.search");
    expect(launcher).toContain("navigator.userAgent");
    expect(launcher).toContain("window.innerWidth");
    expect(launcher).toContain("window.innerHeight");
    const drawer=src("src/components/ui/drawer.tsx");
    expect(drawer).toContain("useOverlayExit(ref, opener, open");
    expect(src("src/components/ui/use-overlay-exit.ts")).toContain("dialog.showModal()");
    expect(drawer).toContain("onCancel={event =>");
    expect(drawer).toContain("onOpenChange(false)");
    expect(drawer).toContain('aria-labelledby={titleId}');
    expect(launcher).toContain("{formReady?<TrackerReportForm contextPrefill={context}/>:null}");
    expect(shell).toContain("TrackerQuickReportLauncher");
  });
});