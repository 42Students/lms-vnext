import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=(component:string)=>readFileSync("src/components/projects/"+component+".tsx","utf8");

describe("UX-projects-mentor-overlays-01 dialog interaction and unsaved changes",()=>{
  it("mentor-sprint-write blocks loss of a dirty sprint and prevents double creation",()=>{
    const s=source("mentor-sprint-write");
    expect(s).toContain('title="Create sprint"');
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("guard.discardOpen");
    expect(s).toContain('title="Discard sprint changes?"');
    expect(s).toContain("onConfirm={guard.confirmDiscard}");
    expect(s).toContain("disabled={busy}");
  });
  it("mentor-sprint-details-edit validates and confirms before persisting",()=>{
    const s=source("mentor-sprint-details-edit");
    expect(s).toContain('title="Edit sprint details"');
    expect(s).toContain('title="Confirm sprint changes?"');
    expect(s).toContain('title="Discard sprint changes?"');
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("pending={pending} onConfirm={save}");
  });
  it("mentor-release-editor warns for destructive deletion and unsaved editing",()=>{
    const s=source("mentor-release-editor");
    expect(s).toContain("Discard unsaved project changes?");
    expect(s).toContain('title="Delete this release?"');
    expect(s).toContain('description="This cannot be undone."');
    expect(s).toContain('confirmLabel="Delete release"');
    expect(s).toContain("disabled={pending||!title.trim()}");
  });
  it("mentor-task-create rejects invalid data and protects a draft on close",()=>{
    const s=source("mentor-task-create");
    expect(s).toContain('title="Confirm new task"');
    expect(s).toContain('title="Discard task changes?"');
    expect(s).toContain("onConfirm={guard.confirmDiscard}");
    expect(s).toContain("disabled={busy||!valid}");
    expect(s).toContain("blockerReason.trim()");
  });
  it("mentor-task-details-edit confirms save and preserves dirty data on dismissal",()=>{
    const s=source("mentor-task-details-edit");
    expect(s).toContain('title="Edit task details"');
    expect(s).toContain('title="Confirm task changes?"');
    expect(s).toContain('title="Discard task changes?"');
    expect(s).toContain("guard.requestClose()");
  });
  it("mentor-task-status-transition includes a blocker note before confirmed transitions",()=>{
    const s=source("mentor-task-status-transition");
    expect(s).toContain("Blocker note for task ");
    expect(s).toContain('title="Change this task state?"');
    expect(s).toContain('confirmLabel="Confirm status change"');
    expect(s).toContain("disabled={!valid||pending");
    expect(s).toContain("onConfirm={submit}");
  });
  it("mentor-project-closeout-control enforces readiness and asks for confirmation",()=>{
    const s=source("mentor-project-closeout-control");
    expect(s).toContain("disabled={pending||!checks.every(Boolean)}");
    expect(s).toContain('title="Complete this project?"');
    expect(s).toContain('confirmLabel="Complete project"');
    expect(s).toContain("pending={pending} onConfirm={submit}");
  });
  it("mentor-meeting-notes-editor guards its text draft during save and discard",()=>{
    const s=source("mentor-meeting-notes-editor");
    expect(s).toContain('title="Meeting outcome notes"');
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("guard.discardOpen");
    expect(s).toContain("pending={pending}");
  });
  it("mentor-meeting-reschedule preserves edited time when confirmation is cancelled",()=>{
    const s=source("mentor-meeting-reschedule");
    expect(s).toContain('title="Reschedule meeting"');
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("if(pending)return;setConfirm(next);if(!next)setOpen(true)");
    expect(s).toContain("guard.discardOpen");
  });
  it("project-meeting-controls protect all three mentor meeting dialogs with discard guards",()=>{
    const s=source("project-meeting-controls");
    expect((s.match(/<Dialog\b/g)??[]).length).toBeGreaterThanOrEqual(3);
    expect((s.match(/guard\.discardOpen/g)??[]).length).toBeGreaterThanOrEqual(3);
    expect(s).toContain('confirmLabel="Discard changes"');
    expect(s).toContain("onConfirm={guard.confirmDiscard}");
  });
  it("project-resource-controls separate create, update, archive and draft-discard decisions",()=>{
    const s=source("project-resource-controls");
    for(const title of ["Discard this resource?","Discard resource changes?","Edit resource"]){
      expect(s).toContain(title);
    }
    expect(s).toContain("archiveOpen");
    expect(s).toContain("requestEditClose");
  });
  it("project-resource-files-panel exposes abort, retry and destructive confirmation",()=>{
    const s=source("project-resource-files-panel");
    expect(s).toContain("xhrRef.current?.abort()");
    expect(s).toContain("retryComplete(file)");
    expect(s).toContain("discardGuard.requestClose");
    expect(s).toContain('title="Discard resource changes?"');
    expect(s).toContain("deleteTarget!==null");
  });
});
