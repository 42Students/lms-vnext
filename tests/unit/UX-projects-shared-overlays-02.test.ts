import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(name:string)=>readFileSync("src/components/projects/"+name+".tsx","utf8");

describe("UX-projects-shared-overlays-02 guarded action/confirmation paths",()=>{
  it("college-project-mentor-dialog names reassignment and stops edits during pending work",()=>{
    const s=src("college-project-mentor-dialog");
    expect(s).toContain('title="Reassign mentor"');
    expect(s).toContain("if(!busy){setOpen(next)");
    expect(s).toContain("if(!next){requestSequence.current++");
    expect(s).toContain("Confirm the reassignment to ");
    expect(s).toContain("<Dialog");
  });
  it("college-project-student-roster-dialog requires review before replacement",()=>{
    const s=src("college-project-student-roster-dialog");
    expect(s).toContain('title="Manage students…"');
    expect(s).toContain('confirmLabel={mode==="REPLACE"?"Replace roster":"Add learners"}');
    expect(s).toContain('"Replace this learner roster ("+removedIds.length+" removed)?"');
    expect(s).toContain("if(removedIds.length>0)setConfirmOpen(true)");
    expect(s).toContain("pending={busy}");
  });
  it("learner-board-task-detail-dialog opens an accessible modal with a 44px close action",()=>{
    const s=src("learner-board-task-detail-dialog");
    expect(s).toContain('<Dialog open={true} historyMode="route"');
    expect(s).toContain("onOpenChange={next=>{if(!next&&navigatingRef.current.shouldReturn())router.replace(returnHref);}}");
    const shared=readFileSync("src/components/ui/dialog.tsx","utf8");
    expect(shared).toContain('aria-labelledby={titleId}');
    expect(shared).toContain('aria-label="Close dialog"');
    expect(s).toContain("min-h-11");
    expect(s).toContain("createLearnerBoardTaskDialogNavigationGuard");
  });
  it("project-admin-submission-review makes locking a separate confirmed action",()=>{
    const s=src("project-admin-submission-review");
    expect(s).toContain('aria-label="Review final submission"');
    expect(s).toContain('title="Lock this submission?"');
    expect(s).toContain('confirmLabel="Lock submission"');
    expect(s).toContain("pending={pending}");
  });
  it("project-archive-control keeps archive/restore actions distinct",()=>{
    const s=src("project-archive-control");
    expect(s).toContain('label={archived?"Restore this workspace?":"Archive this workspace?"}');
    expect(s).toContain("<PopoverPanel");
    expect(s).toContain('onDismiss={dismiss}');
    expect(s).toContain('triggerRef.current?.focus()');
    expect(s).toContain("onDismiss={dismiss}");
    expect(s).toContain("triggerRef.current?.focus()");
    expect(s).toContain('aria-haspopup="dialog"');
  });
  it("project-create-control opens a named workspace creation dialog",()=>{
    const s=src("project-create-control");
    expect(s).toContain('title={basePath.startsWith("/admin/")?"Create Project":"Create workspace"}');
    expect(s).toContain('aria-label="Create workspace"');
    expect(s).toContain("onClick={openDialog}");
  });
  it("project-delivery-reopen-control guards review feedback before discarding",()=>{
    const s=src("project-delivery-reopen-control");
    expect(s).toContain('title="Reopen this submission for revision?"');
    expect(s).toContain('title="Discard review feedback?"');
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("onConfirm={guard.confirmDiscard}");
  });
  it("project-final-delivery-controls confirm acceptance, revision, and feedback discard independently",()=>{
    const s=src("project-final-delivery-controls");
    expect(s).toContain("Accept this submission?");
    expect(s).toContain("Request changes on this submission?");
    expect(s).toContain("Discard final review feedback?");
    expect(s).toContain("guard.requestClose()");
    expect(s).toContain("pending={pending}");
  });
  it("project-lifecycle-actions ask separately before shipping and unshipping",()=>{
    const s=src("project-lifecycle-actions");
    expect(s).toContain("Un-ship this release?");
    expect(s).toContain("Ship this release?");
    expect(s).toContain('title="Review task submission"');
  });
  it("project-mentor-reassignment confirms the selected scope and reports partial failures",()=>{
    const s=src("project-mentor-reassignment");
    expect(s).toContain("actionableSelection.length");
    expect(s).toContain('title={(result?.failures.length??0)+" reassignment(s) failed"}');
    expect(s).toContain("Retry failed workspaces");
    expect(s).toContain("onConfirm={()=>void executeReassignment()}");
  });
  it("project-readiness-override-form uses distinct confirm text for apply and clear",()=>{
    const s=src("project-readiness-override-form");
    expect(s).toContain("copy.clearConfirm : copy.applyConfirm");
    expect(s).toContain("onConfirm={() => { void save(); }}");
  });
  it("project-task-submission-control opens a named review request",()=>{
    const s=src("project-task-submission-control");
    expect(s).toContain('title="Submit for review"');
    expect(s).toContain("<Dialog");
  });
  it("project-team-controls confirms teammate removal separately from adding a member",()=>{
    const s=src("project-team-controls");
    expect(s).toContain('title={learnerOnly?"Add project student":"Add Project teammate"}');
    expect(s).toContain('confirmLabel="Remove teammate"');
    expect(s).toContain("Remove ${member.displayName");
    expect(s).toContain('aria-label="Find eligible member"');
  });
  it("project-template-controls distinguishes duplicate/revoke/archive confirmations",()=>{
    const s=src("project-template-controls");
    expect(s).toContain('title="Create project template"');
    expect(s).toContain('title="Duplicate project template"');
    expect(s).toContain('title="Remove this template from the college?"');
    expect(s).toContain('title="Archive project template?"');
  });
  it("super-admin-template-college-bulk confirms the selected number of colleges",()=>{
    const s=src("super-admin-template-college-bulk");
    expect(s).toContain("selected.length");
    expect(s).toContain("const allowedSelection=new Set(selected)");
    expect(s).toContain("Remove this template from ");
    expect(s).toContain("Assign template to ");
    expect(s).toContain("onConfirm={()=>{void apply();}}");
  });
  it("template-metadata-edit-control blocks dismissal while a revision is pending",()=>{
    const s=src("template-metadata-edit-control");
    expect(s).toContain('title="Edit template overview"');
    expect(s).toContain('title="Discard unsaved changes?"');
    expect(s).toContain("if(pending)return;if(next)setOpen(true);else guard.requestClose()");
  });
});
