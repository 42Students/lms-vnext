import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("nested Add Content editors report dirty state and parent drawer confirms before unmounting them", () => {
  const parent = read("src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js");
  expect(parent).toMatch(/const \[childDirty, setChildDirty\] = useState\(false\)/);
  expect(parent).toMatch(/Discard this content draft\?/);
  expect(parent).toMatch(/onClose=\{\(\) => requestCloseTopLevel\(false\)\}/);
  expect(parent).toMatch(/onClose=\{\(\) => requestCloseChild\(false\)\}/);
  expect(parent).toMatch(/onDirtyChange=\{setChildDirty\}/);
});

test("video, YouTube, Resource and Live Session composers expose dirty state to the parent", () => {
  for (const file of [
    "src/components/Global/Offcanvas/Syallabus/videoform.js",
    "src/components/Global/Offcanvas/Syallabus/youtube.js",
    "src/components/Global/Offcanvas/Syallabus/ResourceComposer.js",
    "src/components/Global/Offcanvas/Syallabus/liveclass.js",
  ]) {
    const src = read(file);
    expect(src).toMatch(/onDirtyChange/);
    expect(src).toMatch(/dirty/);
  }
});

test("quiz and assignment editors also expose their dirty state so outer drawer close cannot bypass their own guard", () => {
  const quiz = read("src/components/Quiz/QuizBuilderModal.jsx");
  const assignment = read("src/components/Global/Offcanvas/Assignment/newAssignment.js");
  expect(quiz).toMatch(/onDirtyChange\?\.\(dirty\)/);
  expect(assignment).toMatch(/onDirtyChange\?\.\(dirty\)/);
});
