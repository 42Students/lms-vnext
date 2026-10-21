import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Assignments from "@/pages/superadmin/sections/Assignments";
import { message } from "antd";
import { getCoursesByCollege, getLessonsByCourse, getLessonContentById } from "@/api/Services/AdminService";
import { getClassesForCourseSyllabus } from "@/api/Services/adminServices/departmentService";
import { listAdminAssignments, publishAllAssignmentGrades } from "@/api/Services/AdminAssignmentService";
import { saveAdminAssignmentContent } from "@/api/Services/AdminAssignmentContentService";

jest.mock("@/api/Services/AdminService", () => ({
  getCoursesByCollege: jest.fn(), getLessonsByCourse: jest.fn(), getLessonContentById: jest.fn(),
  deleteLessonContent: jest.fn(), getClassesByCollege: jest.fn(() => Promise.resolve({ data: [] })),
}));
jest.mock("@/api/Services/adminServices/departmentService", () => ({ getClassesForCourseSyllabus: jest.fn() }));
jest.mock("@/api/Services/AdminAssignmentContentService", () => ({ saveAdminAssignmentContent: jest.fn() }));
jest.mock("@/api/Services/AdminAssignmentService", () => ({
  listAdminAssignments: jest.fn(), getAssignmentSubmissions: jest.fn(),
  updateAssignmentPoints: jest.fn(), publishAssignmentGrade: jest.fn(), publishAllAssignmentGrades: jest.fn(),
}));
jest.mock("@/utils/uploadToR2", () => ({ uploadFileViaPresign: jest.fn() }));
jest.mock("@/components/Global/Upload/UploadFromLinkButton", () =>
  function UploadFromLinkButtonMock({ children }) { return <span>{children}</span>; });
jest.mock("@/utils/csvExport", () => ({ exportRowsToCsv: jest.fn() }));

// Render the real row actions, avoiding AntD table layout/ResizeObserver in jsdom.
jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  const MockModal = ({ open, children, onOk, okText, okButtonProps }) => open
    ? React.createElement("div", null, children,
        onOk ? React.createElement("button", { type: "button", onClick: onOk, disabled: okButtonProps?.disabled }, okText || "OK") : null,
      ) : null;
  MockModal.warning = jest.fn();
  return {
    ...actual,
    Modal: MockModal,
    message: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
    Popconfirm: ({ children, onConfirm }) =>
      React.createElement("span", { onClick: onConfirm }, children),
    Table: ({ columns, dataSource = [] }) =>
      React.createElement("div", { "data-testid": "assignments-table" },
        dataSource.map((record) =>
          React.createElement("div", { key: record.id },
            columns.map((column, index) =>
              React.createElement("div", { key: column.key ?? index },
                column.render ? column.render(record[column.dataIndex], record) : String(record[column.dataIndex] ?? ""),
              ),
            ),
          ),
        ),
      ),
  };
});

const fullAssignment = {
  id: 12, version: 4, lessonId: 19, courseId: 3, facultyId: 88, classId: 9,
  contentType: "assignment", contentTitle: "Week one", points: 10, enabled: true, active: true,
  contentDataDTO: {
    htmlContent: "Original instructions", allowedSubmissionTypes: ["FILE_UPLOAD"],
    assignmentResources: [
      { id: "instructions", type: "INSTRUCTIONS", title: "Instructions", text: "Original instructions" },
      { id: "file-1", type: "FILE", title: "Reference", fileDTO: {
        originalName: "reference.pdf", size: 300, cloudStorageObject: "org-2/college-7/assignments/reference.pdf",
      } },
    ],
  },
};

describe("admin and super-admin shared assignments regression", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getCoursesByCollege.mockResolvedValue({ data: { data: [{ id: 3, course_name: "Java" }] } });
    getLessonsByCourse.mockResolvedValue({ data: { data: [{ id: 19, lesson_name: "Introduction" }] } });
    getClassesForCourseSyllabus.mockResolvedValue({ 9: "CSE-A" });
    getLessonContentById.mockResolvedValue({ data: { data: fullAssignment } });
    listAdminAssignments.mockResolvedValue({
      data: { data: { content: [{ id: 12, title: "Week one", courseId: 3, lessonId: 19,
        description: "Original instructions", points: 10,
        stats: { totalSubmitted: 1, totalStudents: 1, totalGraded: 1 } }], totalElements: 1 } },
    });
    saveAdminAssignmentContent.mockResolvedValue({ data: { status: "OK" } });
  });

  it("renders the Actions column and publishes grades without a ReferenceError", async () => {
    publishAllAssignmentGrades.mockResolvedValue({ data: { data: { published: 1, skippedUngraded: 0 } } });
    render(<Assignments collegeId={7} />);
    expect(await screen.findByText("Week one")).toBeInTheDocument();
    expect(screen.getByText("All eligible sections")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Publish grades"));
    await waitFor(() => expect(publishAllAssignmentGrades).toHaveBeenCalledWith(12));
    await waitFor(() => expect(message.success).toHaveBeenCalledWith("1 published"));
    expect(listAdminAssignments).toHaveBeenCalledWith(7, null, null, 0, 20);
  });

  it("surfaces bulk publish failure without a success toast", async () => {
    publishAllAssignmentGrades.mockRejectedValue({ response: { data: { message: "Not authorized" } } });
    render(<Assignments collegeId={7} />);
    expect(await screen.findByText("Week one")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Publish grades"));
    await waitFor(() => expect(message.error).toHaveBeenCalledWith("Not authorized"));
    expect(message.success).not.toHaveBeenCalled();
  });

  it("loads the full assignment before editing, preserving faculty attachments and submission methods", async () => {
    render(<Assignments collegeId={7} />);
    expect(await screen.findByText("Week one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("img", { name: "edit" }).closest("button"));
    await waitFor(() => expect(getLessonContentById).toHaveBeenCalledWith(12));
    await waitFor(() => expect(getClassesForCourseSyllabus).toHaveBeenCalledWith({
      courseId: 3,
      includeHistoricalClassId: 9,
    }));
    expect(await screen.findByText("Attached: reference.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(saveAdminAssignmentContent).toHaveBeenCalledWith(expect.objectContaining({
      lesson_content_id: 12, lesson_id: 19, course_id: 3, class_id: 9, faculty_id: 88,
      content_data_dto: expect.objectContaining({
        allowed_submission_types: ["FILE_UPLOAD"],
        assignment_resources: [expect.objectContaining({ type: "INSTRUCTIONS" }),
          expect.objectContaining({ type: "FILE", file_dto: expect.objectContaining({ cloud_storage_object: "org-2/college-7/assignments/reference.pdf" }) })],
      }),
    })));
    expect(message.success).toHaveBeenCalledWith("Assignment updated");
  });

  it("prevents edits when full assignment details cannot be loaded", async () => {
    getLessonContentById.mockRejectedValue(new Error("Details unavailable"));
    render(<Assignments collegeId={7} />);
    expect(await screen.findByText("Week one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("img", { name: "edit" }).closest("button"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot load assignment details");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(saveAdminAssignmentContent).not.toHaveBeenCalled();
  });
});
