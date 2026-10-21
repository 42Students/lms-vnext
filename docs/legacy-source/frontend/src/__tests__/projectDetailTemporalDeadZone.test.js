const fs = require("fs");
const path = require("path");
const source = fs.readFileSync(path.join(__dirname, "../components/Projects/ProjectDetailContent.jsx"), "utf8");
const guard = source.indexOf("// One dirty-state guard for every Projects editor.");

describe("mentor project detail render initialization", () => {
  test("unsaved-changes effect is declared after its render-time dependencies", () => {
    expect(guard).toBeGreaterThan(0);
    for (const declaration of [
      "const [overviewEditMode, setOverviewEditMode] = useState(false);",
      "const [taskEditorVisible, setTaskEditorVisible] = useState(false);",
      "const [sprintFormOpen, setSprintFormOpen] = useState(false);",
      "const [releaseFormOpen, setReleaseFormOpen] = useState(false);",
      "const [resourceFormOpen, setResourceFormOpen] = useState(false);",
      "const [memberModalOpen, setMemberModalOpen] = useState(false);",
      "const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);",
      "const [meetingForm] = Form.useForm();",
      "const [meetingModalOpen, setMeetingModalOpen] = useState(false);",
      "const [meetingRequestForm] = Form.useForm();",
      "const [meetingRequestModalOpen, setMeetingRequestModalOpen] = useState(false);",
      "const [deliveryForm] = Form.useForm();",
      "const [submissionModalOpen, setSubmissionModalOpen] = useState(false);",
      "const [autosaveStatus, setAutosaveStatus] = useState(",
    ]) {
      const position = source.indexOf(declaration);
      expect(position).toBeGreaterThan(-1);
      expect(position).toBeLessThan(guard);
    }
  });
  test("navigation and unload protections retain their cleanup", () => {
    expect(source).toContain('router.events.on("routeChangeStart", handleRouteChangeStart)');
    expect(source).toContain('router.events.off("routeChangeStart", handleRouteChangeStart)');
    expect(source).toContain('window.addEventListener("beforeunload", handleBeforeUnload)');
    expect(source).toContain('window.removeEventListener("beforeunload", handleBeforeUnload)');
  });
});
