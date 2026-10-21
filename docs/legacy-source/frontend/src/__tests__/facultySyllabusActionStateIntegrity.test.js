import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("lesson creation protects drafts and uses an immediate write lock", () => {
  const source = read("src/components/Global/Offcanvas/Syallabus/AddLessonDrawer.jsx");
  expect(source).toContain("const submittingRef = useRef(false)");
  expect(source).toContain("if (submittingRef.current) return");
  expect(source).toContain("Discard this lesson draft?");
  expect(source).toContain('Router.events.on("routeChangeStart"');
  expect(source).toContain('window.addEventListener("beforeunload"');
});

test("nested lesson content drafts survive accidental navigation", () => {
  const source = read("src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js");
  expect(source).toContain("childDirty");
  expect(source).toContain("Discard this unsaved content draft?");
  expect(source).toContain('Router.events.on("routeChangeStart"');
  expect(source).toContain('window.addEventListener("beforeunload"');
});

test("resource, video, youtube and live-class writes are immediate single-flight", () => {
  const resource = read("src/components/Global/Offcanvas/Syallabus/ResourceComposer.js");
  const video = read("src/components/Global/Offcanvas/Syallabus/videoform.js");
  const youtube = read("src/components/Global/Offcanvas/Syallabus/youtube.js");
  const live = read("src/components/Global/Offcanvas/Syallabus/liveclass.js");

  expect(resource).toContain("const savingRef = useRef(false)");
  expect(resource).toContain("const uploadingRef = useRef(false)");
  expect(resource).toContain("if (uploadingRef.current || savingRef.current) return");
  expect(video).toContain("const submittingRef = useRef(false)");
  expect(video).toContain("if (submittingRef.current) return");
  expect(youtube).toContain("const submittingRef = useRef(false)");
  expect(youtube).toContain("if (submittingRef.current) return");
  expect(live).toContain("const submittingRef = useRef(false)");
  expect(live).toContain("if (submittingRef.current) return");
});

test("assignment and quiz editors retain their stronger prerequisite and draft guards", () => {
  const assignment = read("src/components/Global/Offcanvas/Assignment/newAssignment.js");
  const quiz = read("src/components/Quiz/QuizBuilderModal.jsx");
  expect(assignment).toMatch(/submitAttemptRef/);
  expect(assignment).toMatch(/Discard assignment changes|Discard this assignment draft/);
  expect(assignment).toContain("Could not load courses");
  expect(assignment).toContain("Could not load lessons");
  expect(quiz).toContain("const savingRef = React.useRef(false)");
  expect(quiz).toContain("Discard quiz changes?");
  expect(quiz).toContain("Reload the quiz before saving changes.");
  expect(quiz).toContain("Could not load eligible sections for this course.");
});
