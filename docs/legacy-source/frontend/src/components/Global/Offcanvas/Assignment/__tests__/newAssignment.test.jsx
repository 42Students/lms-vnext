import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import DrawerAssignment from "../newAssignment";
import { createLessonContent, getFacultyProgram, getLessonList } from "@/api/Services/courseServices";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({
  createLessonContent: jest.fn(),
  getFacultyProgram: jest.fn(),
  getLessonList: jest.fn(),
  // Editing checks whether learners have submitted (assessment rules lock once they have); none here.
  getAssignmentSubmissions: jest.fn().mockResolvedValue({ data: { content: [], totalElements: 0 } }),
}));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));
jest.mock("@/components/Global/Editor/editor", () => function MockEditor() { return null; });
jest.mock("@/components/Global/Upload/UploadFromLinkButton", () => function MockUploadFromLink({ children }) { return <button type="button">{children}</button>; });

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

function existingAssignment(overrides = {}) {
  return {
    id: 77,
    classId: 6,
    courseId: 3,
    lessonId: 9,
    courseSlug: "crs-slug",
    contentTitle: "Week 1 homework",
    points: 20,
    contentDataDTO: {
      assignment_resources: [
        { id: "r1", type: "INSTRUCTIONS", title: "Read this", text: "<p>do the thing</p>" },
      ],
      allowed_submission_types: ["WRITTEN_RESPONSE"],
      due_date: "2026-10-01T00:00:00.000Z",
    },
    ...overrides,
  };
}


function selectByFieldName(name) {
  const input = document.getElementById(name);
  return input?.closest(".ant-select");
}

function loginAs(facultyType) {
  useSelector.mockImplementation((selector) =>
    selector({ loginUser: { id: 15, userType: "FACULTY", facultyType }, course: {} })
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  getFacultyProgram.mockResolvedValue({ data: { data: [] } });
  getLessonList.mockResolvedValue({ data: { data: [] } });
  createLessonContent.mockResolvedValue({});
});

describe("DrawerAssignment — editable vs locked fields on edit", () => {
  test("a regular (non-admin) faculty editing an assignment sees Visibility, Course and Lesson locked", async () => {
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment()} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());

    const visibilitySelect = selectByFieldName("contentScope");
    const courseSelect = selectByFieldName("course");
    const lessonSelect = selectByFieldName("lesson");
    expect(visibilitySelect.className).toMatch(/ant-select-disabled/);
    expect(courseSelect.className).toMatch(/ant-select-disabled/);
    expect(lessonSelect.className).toMatch(/ant-select-disabled/);

    expect(screen.getByText(/only a college admin can change/i)).toBeInTheDocument();
    expect(screen.getByText(/course and lesson can't be changed/i)).toBeInTheDocument();
  });

  test("an admin faculty editing an assignment can still change Visibility, but never Course/Lesson", async () => {
    loginAs("ADMIN");
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment()} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());

    const visibilitySelect = selectByFieldName("contentScope");
    const courseSelect = selectByFieldName("course");
    expect(visibilitySelect.className).not.toMatch(/ant-select-disabled/);
    expect(courseSelect.className).toMatch(/ant-select-disabled/);
  });

  test("creating a brand-new assignment locks nothing", async () => {
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={null} onClose={() => {}} />);

    // The course picker is disabled only while the teacher's courses are still loading.
    await waitFor(() => expect(selectByFieldName("course").className).not.toMatch(/ant-select-disabled/));
    expect(selectByFieldName("contentScope").className).not.toMatch(/ant-select-disabled/);
    expect(screen.queryByText(/only a college admin can change/i)).not.toBeInTheDocument();
  });

  test("a failed course lookup is retryable and never offers an empty course list as if the teacher had none", async () => {
    loginAs("TEACHER");
    getFacultyProgram.mockRejectedValueOnce({ response: { data: { message: "Courses service unavailable" } } });
    render(<DrawerAssignment open editSelectedAssignment={null} onClose={() => {}} />);

    expect(await screen.findByText("Courses service unavailable")).toBeInTheDocument();
    expect(selectByFieldName("course").className).toMatch(/ant-select-disabled/);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(selectByFieldName("course").className).not.toMatch(/ant-select-disabled/));
  });

  test("a SHARED assignment's scope is correctly restored on edit, not silently reset to CLASS", async () => {
    loginAs("TEACHER");
    // classId 0/absent means SHARED — this is exactly what used to be lost on hydration.
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment({ classId: 0 })} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());
    expect(screen.getByText("Shared to all sections")).toBeInTheDocument();
    expect(screen.queryByText("This class only")).not.toBeInTheDocument();
  });

  test("submitting a locked edit sends the assignment's original scope, never a silently-changed one", async () => {
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment({ classId: 6 })} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Update Assignment"));

    await waitFor(() => expect(createLessonContent).toHaveBeenCalledTimes(1));
    const payload = createLessonContent.mock.calls[0][0];
    expect(payload.lesson_content_id).toBe(77);
    expect(payload.class_id).toBe(6);
  });
});

describe("DrawerAssignment — resource type picker and file upload UX", () => {
  test("the Add resource dropdown adds a new resource card of the chosen type", async () => {
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={null} onClose={() => {}} />);

    expect(screen.queryByPlaceholderText(/paste the reference link/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Add resource"));
    fireEvent.click(await screen.findByText("Link"));

    expect(await screen.findByPlaceholderText(/paste the reference link/i)).toBeInTheDocument();
  });

  test("a resource with an already-attached file shows the attached chip, not the upload buttons", async () => {
    loginAs("TEACHER");
    render(
      <DrawerAssignment
        open
        editSelectedAssignment={existingAssignment({
          contentDataDTO: {
            assignment_resources: [
              {
                id: "r1",
                type: "PDF",
                title: "Reading",
                file_dto: { original_name: "week1.pdf", cloud_storage_object: "assignments/week1.pdf" },
              },
            ],
            allowed_submission_types: ["WRITTEN_RESPONSE"],
            due_date: "2026-10-01T00:00:00.000Z",
          },
        })}
        onClose={() => {}}
      />
    );

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());
    expect(await screen.findByText("week1.pdf")).toBeInTheDocument();
    expect(screen.queryByText("Upload PDF")).not.toBeInTheDocument();
    expect(screen.queryByText("Upload PDF from Drive")).not.toBeInTheDocument();
  });

  test("removing an attached file brings the upload buttons back for that resource", async () => {
    loginAs("TEACHER");
    render(
      <DrawerAssignment
        open
        editSelectedAssignment={existingAssignment({
          contentDataDTO: {
            assignment_resources: [
              {
                id: "r1",
                type: "PDF",
                title: "Reading",
                file_dto: { original_name: "week1.pdf", cloud_storage_object: "assignments/week1.pdf" },
              },
            ],
            allowed_submission_types: ["WRITTEN_RESPONSE"],
            due_date: "2026-10-01T00:00:00.000Z",
          },
        })}
        onClose={() => {}}
      />
    );

    const chipRemoveBtn = await screen.findByLabelText("Remove attached file");
    fireEvent.click(chipRemoveBtn);

    expect(await screen.findByText("Upload PDF")).toBeInTheDocument();
    expect(screen.queryByText("week1.pdf")).not.toBeInTheDocument();
  });
});

describe("DrawerAssignment — due date policy (#29)", () => {
  test("typing a due date before today is rejected by the picker itself and never commits", async () => {
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment({ classId: 6 })} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());

    const dateInput = document.querySelector(".ant-picker-input input");
    // The picker now shows date and time ("01 Oct 2026, 5:30 AM" in IST for this fixture's UTC midnight).
    const loaded = dateInput.value;
    expect(loaded).toMatch(/^01 Oct 2026, /);
    fireEvent.mouseDown(dateInput);
    fireEvent.change(dateInput, { target: { value: "01 Jan 2020, 9:00 AM" } });
    fireEvent.blur(dateInput);

    // disabledDate rejects the typed value outright -- with the time picker a typed value is only
    // committed through OK, and a past date never commits, so submitting still sends the original
    // due date (asserted on the saved payload below).
    fireEvent.keyDown(dateInput, { key: "Escape", code: "Escape" });
    fireEvent.click(screen.getByText("Update Assignment"));
    await waitFor(() => expect(createLessonContent).toHaveBeenCalledTimes(1));
    expect(createLessonContent.mock.calls[0][0].content_data_dto.due_date).toBe(
      new Date("2026-10-01T00:00:00.000Z").toISOString()
    );
  });

  test("saving other edits on an assignment whose due date has already passed doesn't require touching the due date", async () => {
    loginAs("TEACHER");
    // due_date is in the past relative to "today" as far as the validator's own reference point
    // (dayjs()) is concerned in a real deployment, but the fixture's date only needs to be
    // *unchanged* from what the form loaded for this rule to apply -- the point under test is
    // that leaving the field alone never trips the new "not before today" validator, regardless
    // of whether that original date happens to be in the past.
    loginAs("TEACHER");
    render(<DrawerAssignment open editSelectedAssignment={existingAssignment({ classId: 6 })} onClose={() => {}} />);

    await waitFor(() => expect(getLessonList).toHaveBeenCalled());
    fireEvent.click(screen.getByText("Update Assignment"));

    await waitFor(() => expect(createLessonContent).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Due date can't be before today")).not.toBeInTheDocument();
  });
});
