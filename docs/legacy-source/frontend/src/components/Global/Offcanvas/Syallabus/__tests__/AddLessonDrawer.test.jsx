import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import AddLessonDrawer from "../AddLessonDrawer";
import Api from "@/api/ApiMethod";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/api/ApiMethod", () => ({ post: jest.fn() }));

jest.mock("@/components/Global/RightDrawer/DrawerWidget", () =>
  function MockDrawerWidget({ drawerOpen, title, children, onClickSecondary, secondaryButtonTitle }) {
    if (!drawerOpen) return null;
    return (
      <div>
        <h1>{title}</h1>
        {children}
        <button onClick={onClickSecondary}>{secondaryButtonTitle}</button>
      </div>
    );
  }
);

function mockState({ loginUserClassId } = {}) {
  useSelector.mockImplementation((selector) =>
    selector({
      loginUser: { id: 4, classId: loginUserClassId, facultyType: "ADMIN", userType: "FACULTY" },
      course: { selectedCourseId: 3, selectedCourseSlug: null },
    })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  Api.post.mockResolvedValue({});
});

async function fillAndSave() {
  fireEvent.change(screen.getByPlaceholderText("Enter lesson name"), { target: { value: "Intro to Loops" } });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(Api.post).toHaveBeenCalledTimes(1));
  return Api.post.mock.calls[0][1];
}

// AdminCourseSyllabus.jsx has its own "Select class to view" dropdown (adminSelectedClassId),
// entirely separate from loginUser.classId -- unlike the teacher course workspace, nothing keeps
// loginUser.classId in sync with it here. A lesson scoped "This class only" must follow the class
// the admin actually has selected on the page, not fall back to the admin's own (often unrelated,
// or entirely unset) personal classId.
test("a lesson scoped 'This class only' uses the page's selected class, not the admin's own classId", async () => {
  mockState({ loginUserClassId: undefined });
  render(<AddLessonDrawer open close={() => {}} adminCourseId={3} adminSelectedClassId={17} />);

  const payload = await fillAndSave();
  expect(payload.class_id).toBe(17);
});

test("falls back to loginUser.classId only when no class is selected on the admin page", async () => {
  mockState({ loginUserClassId: 42 });
  // adminSelectedClassId omitted, or 0 (the "Generic (shared content only)" sentinel).
  render(<AddLessonDrawer open close={() => {}} adminCourseId={3} adminSelectedClassId={0} />);

  const payload = await fillAndSave();
  expect(payload.class_id).toBe(42);
});

test("Shared to all sections always sends class_id 0, regardless of the selected class", async () => {
  mockState({ loginUserClassId: undefined });
  render(<AddLessonDrawer open close={() => {}} adminCourseId={3} adminSelectedClassId={17} />);

  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByText("Shared to all sections"));

  const payload = await fillAndSave();
  expect(payload.class_id).toBe(0);
});
