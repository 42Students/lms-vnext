import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 5 overlay behavior contracts", () => {
  test("shared drawer and confirmation primitives preserve close/focus contracts", () => {
    const drawer = read("src/components/Global/RightDrawer/DrawerWidget.js");
    expect(drawer).toContain("afterOpenChange={handleAfterOpenChange}");
    expect(drawer).toContain("triggerRef.current = document.activeElement");

    const confirm = read("src/components/Global/ModalContainer/ConfirmationModal.jsx");
    expect(confirm).toContain("return result.then");
    expect(confirm).toContain("restoreTriggerFocus");
  });

  test("program and student edit overlays lock dismissal and submit through the form", () => {
    const programs = read("src/pages/superadmin/sections/Programs.js");
    expect(programs).toContain("onOk={() => editForm.submit()}");
    expect(programs).toContain("closable={!editLoading}");
    expect(programs).toContain("keyboard={!editLoading}");
    expect(programs).toContain("maskClosable={false}");

    const students = read("src/pages/superadmin/sections/Students.js");
    expect(students).toContain("onOk={() => editForm.submit()}");
    expect(students).toContain("onFinish={handleEditSubmit}");
    expect(students).toContain("disabled={editLoading}");
    expect(students).toContain("maskClosable={false}");
  });

  test("student move cannot be dismissed while the reassignment write is running", () => {
    const source = read("src/pages/superadmin/sections/Batches.js");
    expect(source).toContain("cancelButtonProps={{ disabled: moveSaving }}");
    expect(source).toContain("closable={!moveSaving}");
    expect(source).toContain("keyboard={!moveSaving}");
    expect(source).toContain("maskClosable={false}");
  });

  test("faculty schedule reassignment keeps the action overlay stable in flight", () => {
    const source = read("src/pages/superadmin/sections/Faculty.js");
    expect(source).toContain("const closeReassignSchedule = () =>");
    expect(source).toContain("if (reassignLoading) return;");
    expect(source).toContain("onCancel={closeReassignSchedule}");
    expect(source).toContain("closable={!reassignLoading}");
    expect(source).toContain("keyboard={!reassignLoading}");
    expect(source).toContain("maskClosable={false}");
    expect(source).toContain("disabled={reassignLoading}");
  });

  test("TPO data-entry overlays deliberately disable backdrop dismissal", () => {
    for (const relative of [
      "src/components/tpo/AddToDriveModal.jsx",
      "src/components/tpo/FollowUpModal.jsx",
      "src/components/tpo/InviteModal.js",
      "src/components/tpo/ImportPreviewModal.js",
    ]) {
      expect(read(relative)).toContain("maskClosable={false}");
    }
  });

  test("destructive admin confirmations reject failures instead of closing as success", () => {
    const admins = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(admins).toContain('throw new Error(errorMessage)');
    expect(admins).toContain('Failed to revoke sessions');

    const domains = read("src/pages/superadmin/sections/CollegeSubdomain.js");
    expect(domains).toContain("throw e; // keep the confirm open so the failure is visible");
  });

  test("Manage College drawer guards dirty nested forms and in-flight mutations", () => {
    const drawer = read("src/pages/superadmin/sections/ManageCollegeDrawer.js");
    expect(drawer).toContain('title: "Discard unsaved college setup changes?"');
    expect(drawer).toContain("if (hasBusyChild)");
    expect(drawer).toContain("maskClosable={false}");
    expect(drawer).toContain("closable={!hasBusyChild}");
    expect(drawer).toContain("keyboard={!hasBusyChild}");
    expect(drawer).toContain("onDirtyChange={onDomainsDirty}");
    expect(drawer).toContain("onDirtyChange={onBrandingDirty}");
    expect(drawer).toContain("onDirtyChange={onAdminsDirty}");

    const domains = read("src/pages/superadmin/sections/CollegeSubdomain.js");
    expect(domains).toContain("onBusyChange?.(saving)");
    expect(domains).toContain("onDirtyChange?.(dirty)");

    const branding = read("src/pages/superadmin/sections/CollegeBranding.js");
    expect(branding).toContain("onDirtyChange?.(dirty)");
    expect(branding).toContain("onBusyChange?.(loading)");

    const admins = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(admins).toContain("onBusyChange?.(loading || accountActionId != null)");
    expect(admins).toContain("onDirtyChange?.(true)");
  });

  test("role mutation overlays preserve staged work and block in-flight dismissal", () => {
    const results = read("src/components/tpo/drive/ResultsEntryModal.jsx");
    expect(results).toContain('title: "Discard entered results?"');
    expect(results).toContain("closable={!saving}");
    expect(results).toContain("maskClosable={false}");

    const letters = read("src/components/tpo/drive/OfferLettersModal.jsx");
    expect(letters).toContain('title: "Discard staged offer letters?"');
    expect(letters).toContain("closable={!uploading}");
    expect(letters).toContain("maskClosable={false}");

    const allocation = read("src/components/admin/electives/AllocateModal.jsx");
    expect(allocation).toContain('title: "Discard allocation setup?"');
    expect(allocation).toContain("onOk={() => form.submit()}");
    expect(allocation).toContain("onFinish={submit}");
    expect(allocation).toContain("closable={!busy}");

    const attendance = read("src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js");
    expect(attendance).toContain('title: "Discard class schedule changes?"');
    expect(attendance).toContain("onClose={requestClose}");
    expect(attendance).toContain("maskClosable={false}");
    expect(attendance).toContain("secondaryLoading={submitting}");

    const lesson = read("src/components/Global/Offcanvas/Syallabus/AddLessonDrawer.jsx");
    expect(lesson).toContain('title: "Discard this lesson draft?"');
    expect(lesson).toContain("resetAndClose()");
    expect(lesson).toContain("closable={!submitting}");
    expect(lesson).toContain("maskClosable={false}");
  });

  test("scheduling and video recording overlays keep recoverable local state", () => {
    const schedule = read("src/components/tpo/drive/ScheduleModal.js");
    expect(schedule).toContain('title: "Discard scheduling changes?"');
    expect(schedule).toContain("rejectOnFailure = false");
    expect(schedule).toContain("Slots and rooms"); // sanity: source loaded
    expect(schedule).toContain("removeSlot(s, true)");
    expect(schedule).toContain("clearUnbooked(true)");
    expect(schedule).toContain("maskClosable={false}");
    expect(schedule).toContain("roomsDirty");

    const video = read("src/components/profile/VideoIntroModal.jsx");
    expect(video).toContain('title: currentStep === "recording" ? "Stop and discard this recording?"');
    expect(video).toContain('currentStep === "uploading"');
    expect(video).toContain('closable={currentStep !== "uploading"}');
    expect(video).toContain('keyboard={currentStep !== "uploading"}');
  });

  test("assignment drawer routes every close affordance through its draft guard", () => {
    const source = read("src/components/Assignments/SubmitAssignmentModal.jsx");
    expect(source).toContain("onClose={requestClose}");
    expect(source).toContain("onClickPrimary={requestClose}");
    expect(source).toContain("Discard this submission?");
    expect(source).toContain("disablePrimary={isSubmitting || isUploadingFile}");
  });

  test("notification overlay covers desktop portal, keyboard trap, mobile focus return and full-width safe-area behavior", () => {
    const source = read("src/components/Dropdowns/Notification/NotifivationDropdown.js");
    expect(source).toContain("createPortal(");
    expect(source).toContain("document.body");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("DIALOG_FOCUSABLE");
    expect(source).toContain("afterOpenChange={handleMobileAfterOpenChange}");
    expect(source).toContain("restoreTriggerFocus");

    const styles = read("src/styles/components/_notification-drawer.scss");
    expect(styles).toContain(".ln-notification-drawer--mobile");
    expect(styles).toContain("width: 100% !important");
    expect(styles).toContain("safe-area-inset-bottom");
  });

  test("global responsive overlay rules cap viewport size without replacing Ant motion", () => {
    const responsive = read("src/styles/components/_responsive-hardening.scss");
    expect(responsive).toContain(".ant-modal-root .ant-modal");
    expect(responsive).toContain("max-width: calc(100vw - 24px) !important");
    expect(responsive).toContain("max-height: calc(100dvh - 24px");
    expect(responsive).toContain(".ant-drawer-root .ant-drawer-content-wrapper");
    expect(responsive).toContain("overflow-y: auto !important");

    const motion = read("src/styles/components/_motion.scss");
    expect(motion).not.toContain(".ant-modal");
    expect(motion).not.toContain(".ant-drawer");
  });

  test("share and decision overlays contain failures and lock unsafe dismissal", () => {
    const share = read("src/components/tpo/drive/ShareModal.js");
    expect(share).toContain('title: "Discard share-link setup?"');
    expect(share).toContain('message="Share link was not created"');
    expect(share).toContain("onFinish={create}");
    expect(share).toContain("maskClosable={false}");
    expect(share).toContain("closable={!busy}");

    const ineligible = read("src/components/tpo/batches/IneligibleModal.jsx");
    expect(ineligible).toContain("cancelButtonProps={{ disabled: busy }}");
    expect(ineligible).toContain("closable={!busy}");
    expect(ineligible).toContain("keyboard={!busy}");

    const review = read("src/components/tpo/drive/ApplicantReviewModal.jsx");
    expect(review).toContain("const requestClose = () =>");
    expect(review).toContain("if (busy) return;");
    expect(review).toContain("closable={!busy}");
    expect(review).toContain("maskClosable={!busy}");
  });

  test("elective roster row mutations expose pending/error state and keep the drawer stable", () => {
    const source = read("src/components/admin/electives/OfferingRosterDrawer.jsx");
    expect(source).toContain("actionBusyId");
    expect(source).toContain('message="Roster change was not saved"');
    expect(source).toContain("loading={actionBusyId === m.memberId}");
    expect(source).toContain("closable={actionBusyId == null}");
    expect(source).toContain("keyboard={actionBusyId == null}");
  });

  test("project scoped portal exception is explicitly audited against the transformed-shell regression", () => {
    const shell = read("src/components/Projects/ProjectModalShell.jsx");
    expect(shell).toContain('document.querySelector(".learn-projects") || document.body');

    const styles = read("src/styles/components/_learn-projects.scss");
    expect(styles).toContain(".learn-projects__shell.ln-module-card:hover");
    expect(styles).toContain("transform: none");
  });

});
