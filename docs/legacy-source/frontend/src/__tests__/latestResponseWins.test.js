import fs from "fs";
import path from "path";

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

// Source contracts for response-order guards whose pages need a full app shell to render.
test("BE-0099: only the newest Organizations list request sets the table", () => {
  const s = read("src/pages/superadmin/sections/Organizations.js");
  expect(s).toContain("const seq = ++fetchSeq.current;");
  expect(s).toContain("if (seq !== fetchSeq.current) return;");
});

test("BE-0108: the TPO profile drops an answer for a previous person", () => {
  const s = read("src/pages/tpo/profile.js");
  expect(s).toContain("return () => { current = false; };");
  expect(s).toContain("String(details.id) !== String(requestedId)");
});

test("BE-0101: the New follow-up recruiter picker keeps only the newest search", () => {
  const s = read("src/components/tpo/TpoTopBar.js");
  expect(s).toContain("if (seq !== recruiterSearchSeq.current) return;");
});

test("BE-0174: header course search and skills search keep only the newest answer", () => {
  const header = read("src/components/Global/Header/Header.js");
  expect(header).toContain("if (seq !== courseSearchSeq.current) return;");
  const skills = read("src/components/Global/SkillsAutocomplete.jsx");
  expect(skills).toContain("if (seq !== skillSearchSeq.current) return;");
});

test("BE-0197: faculty search keeps only the newest answer, for the current college", () => {
  const s = read("src/pages/superadmin/sections/Faculty.js");
  expect(s).toContain("if (seq !== facultySearchSeq.current) return;");
  expect(s).toContain("Number(f.collegeId) === Number(collegeId)");
});

test("BE-0069/BE-0115: create and edit semester lookups don't cancel each other", () => {
  const s = read("src/pages/superadmin/sections/FacultyAssignment.js");
  expect(s).toContain("const seqRef = edit ? editSemestersSeq : semestersSeq;");
});

test("BE-0141: the recruiter drive page drops late answers from the drive you left", () => {
  const s = read("src/pages/recruiter/drives/[jobId].js");
  expect(s).toContain("const stale = () => seq !== loadSeq.current || jobIdRef.current !== jobId;");
  expect(s).toContain("if (jobIdRef.current !== jobId) return; // the address moved on while this was asked");
});

test("BE-0177: the team assignment dialogs can't be dismissed while saving", () => {
  const s = read("src/pages/superadmin/projects/workspaces/[workspaceId]/team.js");
  expect(s).toContain("if (mentorSaving || learnersSaving) return;");
  expect(s).toContain("keyboard={!mentorSaving}");
  expect(s).toContain("keyboard={!learnersSaving}");
});

test("BE-0179: a course id that is neither a slug nor a number ends in 'not found'", () => {
  const s = read("src/pages/college-admin/courses/[id].js");
  expect(s).toMatch(/\} else \{\s*setLoading\(false\);\s*setNotFound\(true\);\s*\}/);
});

test("BE-0183: a failed section lookup says so with Retry", () => {
  const s = read("src/components/admin/courses/AdminCourseSyllabus.jsx");
  expect(s).toContain("setClassesLoadFailed(true);");
  expect(s).toContain('data-testid="admin-syllabus-sections-failed"');
});

test("BE-0125/BE-0098: a college switch drops the last college's image, upload and open edit", () => {
  const courses = read("src/pages/superadmin/sections/Courses.js");
  expect(courses).toContain("setCourseImageUrl(null); setEditCourseImageUrl(null);");
  expect(courses).toContain("if (upload !== imageUploadSeq.current) return false;");
  const halls = read("src/pages/superadmin/sections/LectureHalls.js");
  expect(halls).toMatch(/setData\(\[\]\);\s*setEditModalVisible\(false\);\s*setEditingRecord\(null\);/);
});

test("BE-0168: a tab switch drops a create type the new tab doesn't offer", () => {
  const s = read("src/pages/superadmin/sections/LessonContent.js");
  expect(s).toContain("if (selectedContentType && !allowedTypesForTab.includes(selectedContentType)) {");
});

test("BE-0170: the platform video policy is edited where the server allows it (no college selected)", () => {
  const scoped = read("src/pages/superadmin/sections/LessonContent.js");
  expect(scoped).not.toContain('scopeType="GLOBAL"');
  const page = read("src/pages/superadmin/lesson-content.js");
  expect(page).toContain('router.query.type === "video" && (');
  expect(page).toContain('scopeType="GLOBAL"');
});

test("BE-0171: class-specific content can be reordered from the keyboard", () => {
  const s = read("src/pages/superadmin/sections/LessonContent.js");
  expect(s).toContain("useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })");
  expect(s).toContain("aria-label=\"Reorder: press Space to pick up, arrow keys to move, Space to drop\"");
});

test("BE-0062/BE-0073/BE-0194: known errors per environment; the verification queue shows only the current view", () => {
  expect(read("src/pages/tracker/logs.js")).toContain("key={environment} // BE-0062");
  const v = read("src/components/verification/VerificationWorkspace.jsx");
  expect(v).toContain("if (seq !== queueSeq.current) return;");
  expect(v).toContain("setView(v); setPanel({}); setRows(null); setSelected([]);");
});

test("BE-0161/0162/0163/0167: lesson content keeps only answers for what is picked now", () => {
  const s = read("src/pages/superadmin/sections/LessonContent.js");
  expect(s.split("\n")[0]).toContain("useRef");
  expect(s).toContain("if (seq !== lessonsSeq.current) return;");
  expect(s).toContain("if (seq !== contentsSeq.current) return;");
  expect(s).toContain("if (seq !== classesSeq.current) return;");
  expect(s).toContain("if (viewRef.current.lessonId === lessonAtStart && viewRef.current.classId === classAtStart) setData(reordered);");
});

test("BE-0129/BE-0133/BE-0147: course progress, resources and lesson order keep only current answers", () => {
  expect(read("src/pages/superadmin/sections/CourseProgress.js")).toContain("if (seq !== progressSeq.current) return;");
  expect(read("src/pages/superadmin/sections/AdminResources.js")).toContain("if (seq !== contentsSeq.current) return;");
  expect(read("src/pages/superadmin/sections/Lessons.js")).toContain("if (idEq(selectedCourseRef.current, courseAtStart)) setData(previous);");
});

test("BE-0180/0181/0182: the College Admin syllabus shows only the current course and section, and says when it failed", () => {
  const s = read("src/components/admin/courses/AdminCourseSyllabus.jsx");
  expect(s).toContain("if (seq !== lessonListSeq.current) return;");
  expect(s).toContain("setSyllabusLoadFailed(true);");
  expect(s).toMatch(/setSelectedClassId\(VALUE_GENERIC\);\s*\}, \[SelectedCourse\?\.id, SelectedCourse\?\.slug\]\);/);
});

test("BE-0080/0193/0195: semester order, drive settings and CSV picks keep to what is current", () => {
  expect(read("src/pages/superadmin/sections/SemesterCourseMapping.js")).toContain("if (idEq(selectedSemesterRef.current, semesterAtStart)) setSemesterCourses(previous);");
  const settings = read("src/pages/superadmin/jobs/[jobId]/settings.js");
  expect(settings).toContain("Promise.allSettled([");
  expect(settings).toContain('data-testid="drive-settings-load-error"');
  ["Faculty", "Students"].forEach((f) => {
    const s = read(`src/pages/superadmin/sections/${f}.js`);
    expect(s).toContain("if (seq !== bulkReadSeq.current) return;");
    expect(s).toContain("info.fileList[info.fileList.length - 1]?.originFileObj");
  });
});

test("BE-0061: logs are marked viewed only after a query succeeded", () => {
  expect(read("src/pages/tracker/logs.js")).toContain("if (hasComputedNewSinceRef.current || !statusReady || loading || !lastSuccessAt) return;");
});

test("BE-0110/0111/0164/0165/0187: interview dialogs, job edit, uploads and template overview keep users' work safe", () => {
  const apps = read("src/pages/superadmin/sections/JobApplications.js");
  expect((apps.match(/BE-0110: closing goes through the form's own Cancel\/Close/g) || []).length).toBe(3);
  expect(read("src/pages/superadmin/sections/InterviewFeedbackForm.js")).toContain('onClick={handleCancelClick}>Close</Button>');
  const job = read("src/pages/superadmin/sections/JobForm.js");
  expect(job).toContain("const editBlocked = Boolean(job) && Boolean(loadError);");
  expect(job).toContain("disabled={initialLoading || editBlocked}");
  const lc = read("src/pages/superadmin/sections/LessonContent.js");
  expect(lc).toContain('message.info("Choose the file again before retrying.");');
  expect(lc).toContain("setVideoDurationSeconds(probedDuration || null);");
  const ov = read("src/pages/superadmin/projects/templates/[templateId]/overview.js");
  expect(ov).toContain("if (lines.length) overview[field] = lines; else delete overview[field];");
});

test("BE-0038/0116/0126/0143/0184: reports, batch rules, course policy, lesson delete copy and at-risk search", () => {
  const rep = read("src/pages/tpo/reports/[name].js");
  expect(rep).not.toContain("loadInFlightRef");
  expect(rep).toContain("if (seq !== loadSeqRef.current) return;");
  expect(read("src/pages/tpo/batches/[batchId].js")).toContain("<BatchRulesTab key={batchId}");
  expect(read("src/pages/superadmin/courses.js")).toContain('settingKey="course.minInProgressPercent"');
  const lessons = read("src/pages/superadmin/sections/Lessons.js");
  expect(lessons).not.toContain("permanently destroy");
  expect(lessons).toContain("Uploaded videos, PDFs and presentations are kept on the server");
  expect(read("src/pages/superadmin/projects/at-risk/index.js")).toContain("const t = setTimeout(() => setDebouncedSearch(search), 300);");
});

test("BE-0013/BE-0024: past interviews open on Past; section switches stick to the address", () => {
  // Retired 14 Oct 2026: the student placements redesign replaced this file; behaviour is covered by the studentPlacements* tests.
  ["src/pages/Dashboard/course/Attendance/AttendanceReport.js", "src/pages/Dashboard/course/Sudent/student.js"].forEach((f) =>
    expect(read(f)).toContain("classRouter.replace(canonicalClassHref(classRouter.asPath, selected.classId), undefined, { shallow: true });"));
});

test("BE-0072/BE-0201: settings saves report exactly what was applied; project learner removals are named first", () => {
  const ts = read("src/pages/superadmin/sections/TenantSettings.js");
  expect(ts).toContain("Saved: ${done.join(\", \")}. Not saved: ${failedStep || \"the rest\"}");
  expect(ts.indexOf("await persist(changed)")).toBeLessThan(ts.indexOf("await removeKey(key)"));
  const pr = read("src/pages/superadmin/sections/Projects.js");
  expect(pr).toContain('data-testid="projects-learner-removal-confirm"');
  expect(pr).toContain("onOk: () => submitAssignLearners(values),");
});

test("BE-0034: the audit page labels a range cut at its limit with the server's real total", () => {
  const s = read("src/pages/tpo/audit.js");
  expect(s).toContain('const total = Number(res?.headers?.["x-total-count"]);');
  expect(s).toContain("Showing the newest ${rows.length} of ${rangeTotal} events");
});

test("BE-0010: another semester's course cards are reference-only for learners", () => {
  const s = read("src/components/Course/CoursesContent.jsx");
  expect(s).toContain("const cardHref = (course) => (offCurrentSemester ? null : courseHref(basePath, course, isTeacher));");
  expect((s.match(/const href = cardHref\(course\);/g) || []).length).toBe(2);
});
