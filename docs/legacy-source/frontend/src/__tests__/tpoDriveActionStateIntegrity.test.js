import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("drive create/edit protects unsaved autosave state and gates publish on a successful canonical save", () => {
  const source = read("src/components/tpo/DriveFormPage.js");
  expect(source).toContain("dirtyRef");
  expect(source).toContain("You have drive changes that have not been saved yet");
  expect(source).toContain("supportErrors");
  expect(source).toContain("initializedEditIdRef");
  expect(source).toContain("const savedId = await save()");
  expect(source).toContain("/tpo/drives/" + "$" + "{savedId}?publish=1");
  expect(source).toContain("liveImpactRef");
  expect(source).toContain("savingRef");
});

test("drive detail re-verifies irreversible publish and blocks close/cancel on partial consequence data", () => {
  const source = read("src/pages/tpo/drives/[jobId].js");
  expect(source).toContain("publishCheckRef");
  expect(source).toContain("getEligibilityPreview(job.id)");
  expect(source).toContain("getWorkspaceRounds(job.id)");
  expect(source).toContain("Could not verify eligibility and rounds. Retry before publishing.");
  expect(source).toContain('sectionErrors.some((name) => ["Applicants", "Rounds", "Offers"].includes(name))');
  expect(source).toContain("loadSeqRef");
  expect(source).toContain("busyRef");
});

test("applicant individual decisions and shared bulk actions are synchronous single-flight", () => {
  const applicants = read("src/components/tpo/drive/ApplicantsTab.js");
  const review = read("src/components/tpo/drive/ApplicantReviewModal.jsx");
  const bulk = read("src/components/tpo/bulk/BulkAction.jsx");
  expect(applicants).toContain("busyRef");
  expect(applicants).toContain("if (busyRef.current) return null");
  expect(review).toContain("busyRef");
  expect(review).toContain("if (!current || busyRef.current) return");
  expect(bulk).toContain("const busy = useRef(false)");
  expect(bulk).toContain("if (!state || busy.current) return");
  expect(bulk).toContain("failed");
  expect(bulk).toContain("undo");
});

test("round and scheduling writes protect drafts, dependencies and rapid duplicate actions", () => {
  const rounds = read("src/components/tpo/drive/RoundsTab.js");
  const schedule = read("src/components/tpo/drive/ScheduleModal.js");
  const results = read("src/components/tpo/drive/ResultsEntryModal.jsx");
  const importer = read("src/components/tpo/ImportPreviewModal.js");

  expect(rounds).toContain("roundDirty");
  expect(rounds).toContain("Discard your unsaved round changes?");
  expect(rounds).toContain("savingRef");
  expect(rounds).toContain("busyRef");
  expect(rounds).toContain("blockedCheckSeqRef");
  expect(rounds).toContain("Could not load the pending results");
  expect(schedule).toContain("busyRef");
  expect(schedule).toContain("Schedule data is partially unavailable");
  expect(schedule).toContain("Retry the missing schedule data");
  expect(results).toContain("savingRef");
  expect(importer).toContain("busyRef");
  expect(importer).toContain("row(s) need attention before you can confirm");
});

test("offer flows preserve failed rows and serialize consequential mutations", () => {
  const offers = read("src/components/tpo/drive/OffersTab.js");
  const letters = read("src/components/tpo/drive/OfferLettersModal.jsx");
  expect(offers).toContain("busyRef");
  expect(offers).toContain("recordingRef");
  expect(offers).toContain("failedIds");
  expect(offers).toContain("form.setFieldsValue({ applicationIds: failedIds })");
  expect(letters).toContain("uploadingRef");
  expect(letters).toContain("failedNames");
  expect(letters).toContain("current.filter((file) => failedNames.has(file.name))");
});

test("drive day serializes field actions and retains unresolved pasted attendance rows", () => {
  const source = read("src/pages/tpo/drive-day/[roundId].js");
  expect(source).toContain("mutationRef");
  expect(source).toContain("pasteBusyRef");
  expect(source).toContain("loadSeqRef");
  expect(source).toContain("The unresolved values are still in the box");
  expect(source).toContain("setPasteText([...failed.map");
  expect(source).toContain("Discard this pasted attendance list?");
});
