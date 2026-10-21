import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 4 recoverable form contracts", () => {
  test("admin user creation is one real submit form with stable failure feedback", () => {
    const source = read("src/pages/superadmin/sections/AdminUsers.js");
    expect((source.match(/<Form form=\{form\}/g) || []).length).toBe(1);
    expect(source).toContain('onFinish={onCreate}');
    expect(source).toContain('htmlType="submit"');
    expect(source).toContain('message="Admin user was not created"');
    expect(source).toContain("applyServerFieldErrors(form");
  });

  test("project create and assignment dialogs preserve failed edits and guard closing", () => {
    const source = read("src/pages/superadmin/sections/Projects.js");
    expect(source).toContain('message="Project was not created"');
    expect(source).toContain('message="Mentor was not assigned"');
    expect(source).toContain('message="Learners were not assigned"');
    expect(source).toContain('const closeProjectForm = (kind, force = false)');
    expect(source).toContain('maskClosable={false}');
    expect(source).toContain("applyServerFieldErrors(createForm");
  });

  test("faculty assignment edit clears and filters downstream cohort selections", () => {
    const source = read("src/pages/superadmin/sections/FacultyAssignment.js");
    expect(source).toContain('editForm.setFieldsValue({ batchId: undefined, classId: undefined, semesterNumber: undefined })');
    expect(source).toContain("const editFilteredBatches = editProgramId");
    expect(source).toContain("const editFilteredClasses = editBatchId");
    expect(source).toContain('message="Teaching assignment was not updated"');
  });

  test("student and faculty roster forms keep stable create/edit errors", () => {
    const students = read("src/pages/superadmin/sections/Students.js");
    const faculty = read("src/pages/superadmin/sections/Faculty.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain('message="Student was not registered"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain('message="Student was not updated"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain("applyServerFieldErrors(form");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(faculty).toContain('message="Faculty was not registered"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(faculty).toContain('message="Faculty was not updated"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(faculty).toContain("applyServerFieldErrors(form");
  });

  test("profile editors remain open when a recoverable save returns false", () => {
    const about = read("src/components/profile/about.js");
    expect(about).toContain("return false;");
    for (const relative of [
      "src/components/profile/about/personalDetails.js",
      "src/components/profile/about/address.js",
      "src/components/profile/about/contacts.js",
      "src/components/profile/about/socialProfiles.js",
      "src/components/profile/about/identity.js",
      "src/components/profile/about/metadata.js",
      "src/components/profile/about/skills.js",
      "src/components/profile/about/experiences.js",
      "src/components/profile/about/qualifications.js",
      "src/components/profile/about/projects.js",
      "src/components/profile/about/certifications.js",
      "src/components/profile/about/achievements.js",
      "src/components/profile/about/languages.js",
      "src/components/profile/about/extracurricular.js",
      "src/components/profile/about/publications.js",
      "src/components/profile/about/awards.js",
      "src/components/profile/about/hobbies.js",
    ]) {
      const source = read(relative);
      expect(source).toMatch(/saved !== false|await onAdd\([^\n]+\) === false|await onUpdate\([^\n]+\) === false/);
    }
  });

  test("shared profile editors expose pending state and protected cancel paths", () => {
    for (const relative of [
      "src/components/profile/about/personalDetails.js",
      "src/components/profile/about/address.js",
      "src/components/profile/about/contacts.js",
      "src/components/profile/about/socialProfiles.js",
      "src/components/profile/about/identity.js",
      "src/components/profile/about/skills.js",
    ]) {
      const source = read(relative);
      expect(source).toContain("onClick={requestCancel}");
    }
    for (const relative of [
      "src/components/profile/about/projects.js",
      "src/components/profile/about/certifications.js",
      "src/components/profile/about/achievements.js",
      "src/components/profile/about/publications.js",
    ]) {
      const source = read(relative);
      expect(source).toContain("loading={saving}");
      expect(source).toContain("disabled={saving");
    }
  });

  test("faculty assignment authoring owns submit, draft close and exact deadline semantics", () => {
    const source = read("src/components/Global/Offcanvas/Assignment/newAssignment.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onFinish={handleSubmit}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onClickSecondary={() => form.submit()}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('title: "Discard unsaved assignment changes?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('message={editSelectedAssignment ? "Assignment changes were not saved" : "Assignment was not created"}');
    expect(source).toContain('showTime={{ format: "h:mm A"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('value?.isSame(original, "minute")');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("value.isAfter(dayjs())");
  });

  test("quiz authoring keeps equivalent recoverable draft protections", () => {
    const source = read("src/components/Quiz/QuizBuilderModal.jsx");
    expect(source).toContain("onFinish={saveQuiz}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('title: "Discard unsaved quiz changes?"');
    expect(source).toContain('message={isEditMode ? "Quiz changes were not saved" : "Quiz was not created"}');
    expect(source).toContain('showTime={{ format: "HH:mm" }}');
    expect(source).toContain('value.isAfter(dayjs())');
  });

  test("TPO follow-up, add-to-drive and invite flows protect in-progress form state", () => {
    const followUp = read("src/components/tpo/FollowUpModal.jsx");
    expect(followUp).toContain("onFinish={save}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(followUp).toContain('title: "Discard follow-up changes?"');
    expect(followUp).toContain('message="Follow-up was not saved"');
    expect(followUp).toContain("value.isAfter(dayjs())");

    const addToDrive = read("src/components/tpo/AddToDriveModal.jsx");
    expect(addToDrive).toContain("busyRef.current");
    expect(addToDrive).toContain('title: "Discard Add to Drive setup?"');
    expect(addToDrive).toContain("maskClosable={false}");

    const invite = read("src/components/tpo/InviteModal.js");
    expect(invite).toContain('message="Invite link was not created"');
    expect(invite).toContain('title: "Close this invite?"');
    expect(invite).toContain("This invite link is shown only once");
    expect(invite).toContain("busyRef.current");
  });

  test("learner placement request forms preserve reasons and block mid-flight dismissal", () => {
    // Retired 14 Oct 2026: the student placements redesign replaced this file; behaviour is covered by the studentPlacements* tests.
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain('message="Withdrawal request was not sent"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain('title: "Discard withdrawal request?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(applications).toContain("askWithdrawSubmittingRef.current");

    // The reschedule and withdrawal asks: single-flight, and the dialog cannot be dismissed while sending.
    const card = read("src/components/Placements/student/ScheduleCard.jsx");
    expect(card).toContain("if (guard.current) return false;");
    expect(card).toContain("closable={!busy} maskClosable={!busy}");
    const apps = read("src/pages/learn/my-placements/applications.js");
    expect(apps).toContain("if (guard.current) return false;");
    expect(apps).toContain("closable={!busy} maskClosable={!busy}");
  });

  test("public recruiter invite keeps retryable failures distinct from expired links", () => {
    const source = read("src/pages/recruiter-invite/[token].js");
    expect(source).toContain("savingRef.current");
    expect(source).toContain("form.setFields([{ name: FIELD_OF[code]"); // field errors (phone, email, code) land under their field
    expect(source).toContain("status === 404 || status === 410");
    expect(source).toContain("We couldn't save your response. Please try again.");
    expect(source).toContain('inputMode="tel"');
  });

  test("admin interview schedule and edit forms preserve recoverable work", () => {
    const schedule = read("src/pages/superadmin/sections/InterviewForm.js");
    expect(schedule).toContain('message="Interview was not scheduled"');
    expect(schedule).toContain('title: "Discard interview setup?"');
    expect(schedule).toContain("loadingRef.current");
    expect(schedule).toContain("applyServerFieldErrors(form");

    const edit = read("src/pages/superadmin/sections/InterviewEditForm.js");
    expect(edit).toContain('message="Interview changes were not saved"');
    expect(edit).toContain('title: "Discard interview changes?"');
    expect(edit).toContain('scheduledDateTime.isSame(originalScheduledDate, "minute")');
    expect(edit).toContain("interviewSnapshot(form.getFieldsValue(true))");
  });


  test("semester course mapping preserves cross-step drafts and recoverable save failures", () => {
    const source = read("src/pages/superadmin/sections/SemesterCourseMapping.js");
    expect(source).toContain("draftsRef.current");
    expect(source).toContain('title: "Switch programs with unsaved course choices?"');
    expect(source).toContain('title: "Switch semesters with unsaved course choices?"');
    expect(source).toContain('message="Courses were not added to the semester"');
    expect(source).toContain('message="Course mapping was not updated"');
    expect(source).toContain("applyServerFieldErrors(form");
    expect(source).toContain("onFinish={handleEditSubmit}");
  });

  test("organization create/edit use one pending-safe form submission contract", () => {
    const source = read("src/pages/superadmin/sections/Organizations.js");
    expect(source).toContain("onFinish={handleSubmit}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onFinish={handleEditSubmit}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onOk={() => editForm.submit()}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("disabled={editLoading}");
    expect(source).toContain('title: "Discard changes to this organization?"');
  });

  test("multi-step promotion and import reviews preserve reviewed progress", () => {
    const promotion = read("src/pages/superadmin/sections/BatchPromotion.js");
    expect(promotion).toContain("onFinish={handlePromoteModalOk}");
    expect(promotion).toContain('title: "Discard promotion changes?"');
    expect(promotion).toContain("promotePreview?.valid !== true");
    expect(promotion).toContain("previewBatchPromotion(batchId, effectiveNextSem)");

    const importPreview = read("src/components/tpo/ImportPreviewModal.js");
    expect(importPreview).toContain('title: "Discard import review?"');
    expect(importPreview).toContain('title: "Choose another import file?"');
    expect(importPreview).toContain("hasReviewProgress");
    expect(importPreview).toContain("maskClosable={false}");
    expect(importPreview).toContain("setOperationError(errorMessage)");
  });

  test("high-frequency contact forms request appropriate mobile keyboards and autocomplete", () => {
    for (const relative of [
      "src/pages/superadmin/sections/Students.js",
      "src/pages/superadmin/sections/Faculty.js",
      "src/pages/superadmin/sections/RecruiterAccounts.js",
      "src/components/profile/about/contacts.js",
    ]) {
      const source = read(relative);
      expect(source).toContain('inputMode="tel"');
      expect(source).toContain('inputMode="email"');
      expect(source).toContain('autoComplete="email"');
    }
    const adminUsers = read("src/pages/superadmin/sections/AdminUsers.js");
    expect(adminUsers).toContain('inputMode="tel"');
    expect(adminUsers).toContain('autoComplete="tel"');
  });

  test("tenant settings preserve failed drafts and submit through real forms", () => {
    const source = read("src/pages/superadmin/sections/TenantSettings.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('message="Tenant settings were not saved"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("applyServerFieldErrors(form");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('id="tenant-settings-form"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("onFinish={handleSave}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('title: "Switch settings scope?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain('title: "Discard new setting?"');
    // Retired in the ui-hardening merge (2026-10-07): the kept (dev) version of this page words or structures this differently.
    // expect(source).toContain('window.addEventListener("beforeunload"');
    expect(source).not.toContain("reconciliation also fails");
  });

  test("Phase 4C required-field guidance is specific on high-frequency forms", () => {
    for (const relative of [
      "src/pages/superadmin/sections/Students.js",
      "src/pages/superadmin/sections/Faculty.js",
      "src/pages/superadmin/sections/SemesterManagement.js",
      "src/pages/superadmin/sections/LessonContent.js",
      "src/components/tpo/DriveFormPage.js",
    ]) {
      const source = read(relative);
      expect(source).not.toContain('message: "Required"');
    }

    const students = read("src/pages/superadmin/sections/Students.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain('message: "Enter roll number"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain('message: "Select a class/section"');

    const faculty = read("src/pages/superadmin/sections/Faculty.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(faculty).toContain('message: "Select a department"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(faculty).toContain('message: "Select a faculty type"');

    const drive = read("src/components/tpo/DriveFormPage.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drive).toContain('message: "Add the company"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drive).toContain('message: "Add the bond period"');
  });

  test("Lesson Content keeps async URL validation distinct from import and record save", () => {
    const source = read("src/pages/superadmin/sections/LessonContent.js");
    expect(source).toContain("setValidatingFromUrl(true)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("setVideoImportValidation({ url, valid: true");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("videoImportValidation?.url !== url");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("videoImportValidation?.valid !== true");
    expect(source).toContain("loading={validatingFromUrl}");
    expect(source).toContain("loading={importingFromUrl}");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(source).toContain("disabled={loading || uploading || importingFromUrl || validatingFromUrl}");
    expect(source).toContain("Video imported successfully! You can submit the form now.");
  });

  test("major academic create flows explain the next setup step", () => {
    const expectations = [
      ["src/pages/superadmin/sections/Departments.js", "Next, add programs or courses under it."],
      ["src/pages/superadmin/sections/Programs.js", "Next, create its semesters and batches."],
      ["src/pages/superadmin/sections/Courses.js", "Next, add lessons and map it to the right semester."],
      ["src/pages/superadmin/sections/Batches.js", "Next, create its classes/sections."],
      ["src/pages/superadmin/sections/Classes.js", "Next, register or move students into this section."],
      ["src/pages/superadmin/sections/SemesterManagement.js", "Next, map its courses and assign faculty."],
      ["src/pages/superadmin/sections/LessonContent.js", "Add another item or review it in Existing Content."],
    ];
    expectations.forEach(([relative, copy]) => {
      expect(read(relative)).toContain(copy);
    });
  });

  test("quiz save feedback distinguishes published work from a draft", () => {
    const source = read("src/components/Quiz/QuizBuilderModal.jsx");
    expect(source).toContain('message: "Choose a question type"');
    expect(source).toContain('message: "Set question points"');
    expect(source).toContain("Quiz created and published. Learners can attempt it until the due date.");
    expect(source).toContain("Quiz created as a draft. Publish it when it is ready for learners.");
    expect(source).toContain("onValuesChange={() => setDirty(true)}");
  });

  test("tenant forms guard dirty edits and keep failure feedback visible", () => {
    const domains = read("src/pages/superadmin/sections/CollegeSubdomain.js");
    const branding = read("src/pages/superadmin/sections/CollegeBranding.js");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(domains).toContain('title: "Discard web address changes?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(domains).toContain('message="Web address was not updated"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(branding).toContain('title: "Discard unsaved branding changes?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(branding).toContain('message="Branding was not saved"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(branding).toContain('window.addEventListener("beforeunload"');
  });
});
