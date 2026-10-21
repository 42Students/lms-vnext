import { buildAdminAssignmentUpdatePayload } from "@/utils/adminAssignmentEdit";

const editable = {
  id: 12,
  lessonId: 19,
  courseId: 3,
  classId: 8,
  facultyId: 31,
  sequence: 4,
  deadline: "2026-09-30T12:00:00",
  enabled: true,
  active: true,
  contentDataDTO: {
    htmlContent: "Original instructions",
    allowDiscussions: true,
    viewAfterSchedule: true,
    viewBeforeSchedule: false,
    allowedSubmissionTypes: ["WRITTEN_RESPONSE", "FILE"],
    assignmentResources: [{
      id: "resource-1",
      type: "FILE",
      title: "Reference PDF",
      fileDTO: { size: 1234, originalName: "reference.pdf", cloudStorageObject: "assignments/reference.pdf" },
    }],
    fileDTO: { cloudStorageObject: "assignments/legacy.pdf" },
  },
};

const deadline = {
  format: jest.fn(() => "2026-10-01T17:00:00"),
  toISOString: jest.fn(() => "2026-10-01T17:00:00.000Z"),
};

describe("admin assignment update payload", () => {
  it("retains original class, author, resource files and submission rules while updating instructions", () => {
    const result = buildAdminAssignmentUpdatePayload(editable, {
      contentTitle: "Updated assignment", description: "New instructions", points: 20, deadline,
    });
    expect(result).toMatchObject({
      lesson_id: 19,
      course_id: 3,
      class_id: 8,
      faculty_id: 31,
      sequence: 4,
      content_title: "Updated assignment",
      points: 20,
      deadline: "2026-10-01T17:00:00",
      clear_deadline: false,
      content_data_dto: {
        html_content: "New instructions",
        due_date: "2026-10-01T17:00:00.000Z",
        allow_discussions: true,
        view_after_schedule: true,
        view_before_schedule: false,
        allowed_submission_types: ["WRITTEN_RESPONSE", "FILE"],
        assignment_resources: [{
          id: "resource-1", title: "Reference PDF",
          file_dto: { original_name: "reference.pdf", cloud_storage_object: "assignments/reference.pdf" },
        }],
        file_dto: { cloud_storage_object: "assignments/legacy.pdf" },
      },
    });
  });

  it("explicitly clears a removed deadline and handles original assignments with no resources", () => {
    const result = buildAdminAssignmentUpdatePayload({
      id: 13, lessonId: 20, courseId: 3, deadline: "2026-09-30T12:00:00", contentDataDTO: { htmlContent: "Old" },
    }, { contentTitle: "Updated", description: "", points: 0, deadline: null });
    expect(result.clear_deadline).toBe(true);
    expect(result.deadline).toBeNull();
    expect(result.content_data_dto.html_content).toBe("");
    expect(result.content_data_dto.due_date).toBe("");
    expect(result.content_data_dto).not.toHaveProperty("assignment_resources");
  });

  it("refuses to update when full assignment details or its lesson/course identifiers are missing", () => {
    expect(() => buildAdminAssignmentUpdatePayload(null, {})).toThrow("Assignment details could not be loaded");
    expect(() => buildAdminAssignmentUpdatePayload({ id: 12, courseId: 3 }, {}))
      .toThrow("Assignment details could not be loaded");
    expect(() => buildAdminAssignmentUpdatePayload({ id: 12, lessonId: 19 }, {}))
      .toThrow("Assignment details could not be loaded");
  });
});
