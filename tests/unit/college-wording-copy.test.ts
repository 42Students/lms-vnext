import { describe, expect, it } from "vitest";
import {
  ACADEMIC_SETUP_GENERIC_ERROR,
  academicSetupErrorMessage,
  isMachineErrorCode,
} from "@/modules/academics/academic-setup-error-copy";
import { DEPARTMENT_COPY } from "@/modules/admin-ui/department-copy";
import { SEMESTER_COPY, semesterShortLabel } from "@/modules/academics/semester-copy";
import { LECTURE_HALL_COPY, ROOM_TYPE_LABELS } from "@/modules/academics/lecture-hall-copy";
import { TERM_MAPPING_COPY } from "@/modules/academics/college-term-mapping-model";
import { BATCH_PROMOTION_COPY, promotionImpactMessage } from "@/modules/academics/college-batch-promotion-copy";
import { ADMIN_ATTENDANCE_COPY } from "@/modules/attendance/admin-attendance-copy";
import {
  COLLEGE_COURSE_TAB_COPY,
  collegeAudienceLabel,
  collegeLessonVisibilityLabel,
  collegeResultsLabel,
  collegeStatusLabel,
} from "@/modules/courses/college-course-tabs-copy";
import {
  COLLEGE_COURSES_COPY,
  FACULTY_ASSIGNMENT_COPY,
  courseVisibleToStudentsLabel,
  facultyAssignmentRoleLabel,
} from "@/modules/courses/college-courses-copy";

describe("COL-academic-setup-12 no raw machine codes", () => {
  it("maps known codes to the legacy sentences", () => {
    expect(academicSetupErrorMessage(new Error("PROGRAM_NAME_CONFLICT")))
      .toBe("Program name already exists in this department");
    expect(academicSetupErrorMessage(new Error("BATCH_HAS_DEPENDENCIES")))
      .toBe("Cannot delete batch: it has classes. Delete/move the classes first.");
  });
  it("never shows an unknown code such as PROMOTION_FAILED", () => {
    expect(isMachineErrorCode("PROMOTION_FAILED")).toBe(true);
    expect(academicSetupErrorMessage(new Error("PROMOTION_FAILED")))
      .toBe("The form could not be saved. Please review it and try again.");
    expect(academicSetupErrorMessage("REQUEST_FAILED", "Semester was not updated")).toBe("Semester was not updated");
    expect(ACADEMIC_SETUP_GENERIC_ERROR).toBe("The form could not be saved. Please review it and try again.");
  });
  it("keeps readable sentences", () => {
    expect(academicSetupErrorMessage(new Error("Enter valid batch details."))).toBe("Enter valid batch details.");
  });
});

describe("COL-academic-setup-18 departments", () => {
  it("uses the exact legacy strings", () => {
    expect(DEPARTMENT_COPY).toMatchObject({
      createCardTitle: "Create New Department", existingTitle: "Existing Departments",
      nameLabel: "Department Name", createButton: "Create Department",
      namePlaceholder: "e.g., Computer Science & Engineering",
      editTitle: "Edit Department", saveButton: "Save Changes",
      updatedMessage: "Department updated successfully!",
    });
  });
});

describe("COL-academic-setup-26 semesters", () => {
  it("uses the exact legacy strings", () => {
    expect(SEMESTER_COPY.editTitle).toBe("Edit Semester");
    expect(SEMESTER_COPY.promotionNote).toBe("Batches can only be promoted into an active semester.");
    expect([SEMESTER_COPY.statusLabel, SEMESTER_COPY.statusActive, SEMESTER_COPY.statusInactive])
      .toEqual(["Status", "Active", "Inactive"]);
    expect(SEMESTER_COPY.updatedMessage).toBe("Semester updated successfully!");
    expect(SEMESTER_COPY.deleteTitle).toBe("Delete this semester?");
    expect(SEMESTER_COPY.deleteBlocked)
      .toBe("This is blocked while any courses are mapped to this semester — remove the course mappings first.");
    expect(semesterShortLabel(3)).toBe("Sem 3");
  });
});

describe("COL-academic-setup-37 lecture halls", () => {
  it("uses the exact legacy room types and labels", () => {
    expect(Object.values(ROOM_TYPE_LABELS)).toEqual([
      "Classroom", "Lecture Hall", "Laboratory", "Seminar Hall", "Auditorium", "Conference Room",
    ]);
    expect(LECTURE_HALL_COPY.createTitle).toBe("Create New Lecture Hall / Room");
    expect(LECTURE_HALL_COPY.nameLabel).toBe("Room Name");
    expect(LECTURE_HALL_COPY.typeLabel).toBe("Room Type");
    expect(LECTURE_HALL_COPY.createdMessage).toBe("Lecture hall created successfully!");
    expect(LECTURE_HALL_COPY.updatedMessage).toBe("Lecture hall updated successfully!");
    expect(LECTURE_HALL_COPY.columns.description).toBe("Description");
  });
});

describe("COL-academic-setup-11 semester course mapping", () => {
  it("uses the exact legacy confirm and success wording", () => {
    expect(TERM_MAPPING_COPY.removeTitle("Data Structures")).toBe("Remove “Data Structures” from this semester?");
    expect(TERM_MAPPING_COPY.removeButton).toBe("Remove");
    expect(TERM_MAPPING_COPY.addedMessage(2)).toBe("Added 2 course(s) to this semester.");
    expect(TERM_MAPPING_COPY.removedMessage("DSA")).toBe("Removed “DSA” from this semester.");
    expect(TERM_MAPPING_COPY.columns.courseName).toBe("Course Name");
    expect(TERM_MAPPING_COPY.core).toBe("Core (Mandatory)");
  });
});

describe("COL-academic-setup-34 batch promotion", () => {
  it("uses the exact legacy verdict and impact wording", () => {
    expect(BATCH_PROMOTION_COPY.notReady).toBe("Can’t promote yet");
    expect(BATCH_PROMOTION_COPY.ready).toBe("Server-verified promotion is ready");
    expect(BATCH_PROMOTION_COPY.promoteButton).toBe("Promote");
    expect(promotionImpactMessage(1, 1)).toBe("This will affect 1 student across 1 class");
    expect(promotionImpactMessage(30, 2)).toBe("This will affect 30 students across 2 classes");
  });
});

describe("COL-attendance-08 monthly percent column", () => {
  it("uses the exact legacy header, label and tooltip", () => {
    expect(ADMIN_ATTENDANCE_COPY.monthPercentHeader).toBe("% month");
    expect(ADMIN_ATTENDANCE_COPY.monthPercentAria).toBe("Attendance percentage this month, marked sessions only");
    expect(ADMIN_ATTENDANCE_COPY.monthPercentTooltip)
      .toBe("This month, marked sessions only. Exam eligibility is judged on the whole semester.");
  });
});

describe("COL-course-tabs-20/21 course tab wording", () => {
  it("uses legacy titles and headings", () => {
    expect(COLLEGE_COURSE_TAB_COPY.videosTitle).toBe("Videos");
    expect(COLLEGE_COURSE_TAB_COPY.progressTitle).toBe("Course Progress");
    expect(COLLEGE_COURSE_TAB_COPY.progressDescription)
      .toBe("See measured completion for a class and course, then focus on the students furthest behind.");
    expect(Object.values(COLLEGE_COURSE_TAB_COPY.lessonColumns))
      .toEqual(["Lesson Name", "Course", "Order", "Students see it"]);
  });
  it("replaces internal vocabulary with legacy values", () => {
    expect(collegeLessonVisibilityLabel({ pathStatus: "PUBLISHED", status: "ACTIVE", visibleToStudents: true })).toBe("Visible");
    expect(collegeLessonVisibilityLabel({ pathStatus: "PUBLISHED", status: "DRAFT", visibleToStudents: true })).toBe("Hidden");
    expect(collegeAudienceLabel(false)).toBe("All sections taking this course");
    expect(collegeAudienceLabel(true)).toBe("One section");
    expect(collegeResultsLabel(true)).toBe("Released");
    expect(collegeResultsLabel(false)).toBe("Withheld");
    expect(collegeStatusLabel("PUBLISHED")).toBe("Published");
  });
});

describe("COL-courses-content-06/13/15", () => {
  it("uses legacy course page wording", () => {
    expect(COLLEGE_COURSES_COPY.createTitle).toBe("Create New Course");
    expect(COLLEGE_COURSES_COPY.existingTitle).toBe("Existing Courses");
    expect(COLLEGE_COURSES_COPY.nameLabel).toBe("Course Name");
    expect(COLLEGE_COURSES_COPY.createdMessage("DSA"))
      .toBe("Created course “DSA”. Next, add lessons and map it to the right semester.");
    expect(COLLEGE_COURSES_COPY.createFailed).toBe("Course was not created");
    expect(COLLEGE_COURSES_COPY.deleteFailed).toBe("Course was not deleted");
    expect(courseVisibleToStudentsLabel("ACTIVE")).toBe("Visible");
    expect(courseVisibleToStudentsLabel("ARCHIVED")).toBe("Hidden");
  });
  it("prints role names instead of enums", () => {
    expect(facultyAssignmentRoleLabel("PRIMARY")).toBe("Primary Instructor");
    expect(facultyAssignmentRoleLabel("CO_TEACHER")).toBe("Co-Teacher");
    expect(facultyAssignmentRoleLabel("TA")).toBe("Teaching Assistant");
    expect(FACULTY_ASSIGNMENT_COPY.title).toBe("Faculty Assignments");
    expect(Object.values(FACULTY_ASSIGNMENT_COPY.columns))
      .toEqual(["Faculty", "Course", "Class", "Role", "Active", "Actions"]);
  });
});
