import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResourceComposer from "../ResourceComposer";
import { createLessonContent } from "@/api/Services/courseServices";
import { updateLessonContent } from "@/api/Services/AdminService";

let mockState = { loginUser: { userType: "FACULTY", facultyType: "TEACHER", LessonId: 701, classId: 601 }, course: { selectedCourseId: 501 } };

jest.mock("react-redux", () => ({ useSelector: (selector) => selector(mockState) }));
jest.mock("@/api/Services/courseServices", () => ({ createLessonContent: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ updateLessonContent: jest.fn() }));
jest.mock("@/utils/resourceUploadToR2", () => ({ uploadResourceFile: jest.fn(), getContentTypeFromFile: jest.fn() }));

const FILE_MATERIAL = {
  kind: "FILE",
  title: "arrays-cheatsheet.pdf",
  file_dto: {
    cloud_storage_object: "org-1/college-1/lesson-content/00000000-0000-4000-8000-000000000001.pdf",
    original_name: "arrays-cheatsheet.pdf",
    mimetype: "application/pdf",
    size: 2048,
  },
};

const existing = (overrides = {}, data = {}) => ({
  id: 8003,
  lessonId: 701,
  courseId: 501,
  classId: 601,
  facultyId: 42,
  sequence: 3,
  points: 5,
  active: true,
  enabled: true,
  contentTitle: "Arrays Cheatsheet",
  contentType: "resource",
  contentDataDTO: { resource_materials: [FILE_MATERIAL], text: "Read first", ...data },
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  updateLessonContent.mockResolvedValue({});
  createLessonContent.mockResolvedValue({});
});

describe("ResourceComposer edit mode (faculty editing a Resource, incl. migrated PDFs)", () => {
  test("prefills the existing Resource and hides the create-only Visibility control", () => {
    render(<ResourceComposer editing={existing()} back={jest.fn()} />);
    expect(screen.getByLabelText("Resource title")).toHaveValue("Arrays Cheatsheet");
    expect(screen.getByLabelText(/Notes/)).toHaveValue("Read first");
    expect(screen.getByText(/File: arrays-cheatsheet\.pdf/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Visibility")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  test("saving a title change updates in place through the update endpoint and keeps every material", async () => {
    const back = jest.fn();
    render(<ResourceComposer editing={existing()} back={back} />);
    fireEvent.change(screen.getByLabelText("Resource title"), { target: { value: "Arrays Cheatsheet v2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateLessonContent).toHaveBeenCalledTimes(1));
    const [id, payload] = updateLessonContent.mock.calls[0];
    expect(id).toBe(8003);
    expect(payload).toMatchObject({
      lesson_id: 701, course_id: 501, class_id: 601, faculty_id: 42,
      content_type: "RESOURCE", content_title: "Arrays Cheatsheet v2",
      sequence: 3, points: 5, active: true, enabled: true,
    });
    expect(payload.content_data_dto.resource_materials).toHaveLength(1);
    expect(payload.content_data_dto.resource_materials[0].file_dto.cloud_storage_object).toBe(FILE_MATERIAL.file_dto.cloud_storage_object);
    expect(payload.content_data_dto.text).toBe("Read first");
    expect(createLessonContent).not.toHaveBeenCalled();
    await waitFor(() => expect(back).toHaveBeenCalledWith(true));
  });

  test("a notes-only Resource (migrated article) keeps its formatted text on save", async () => {
    const row = existing({ contentTitle: "Intro article" }, { resource_materials: [], text: "", html_content: "<p>Hello <b>class</b></p>" });
    render(<ResourceComposer editing={row} back={jest.fn()} />);
    expect(screen.getByText(/formatted text, which is kept/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Resource title"), { target: { value: "Intro article (edited)" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(updateLessonContent).toHaveBeenCalledTimes(1));
    const payload = updateLessonContent.mock.calls[0][1];
    expect(payload.content_data_dto.html_content).toBe("<p>Hello <b>class</b></p>");
    expect(payload.content_data_dto.resource_materials).toEqual([]);
  });

  test("removing the last material with no notes is refused and nothing is sent", async () => {
    render(<ResourceComposer editing={existing({}, { text: "" })} back={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Remove arrays-cheatsheet\.pdf/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Add a file, HTTPS link, or notes before saving.")).toBeInTheDocument();
    expect(updateLessonContent).not.toHaveBeenCalled();
  });

  test("a shared (all-sections) Resource is edited with class_id 0, never a class it does not belong to", async () => {
    render(<ResourceComposer editing={existing({ classId: 0 })} back={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updateLessonContent).toHaveBeenCalledTimes(1));
    expect(updateLessonContent.mock.calls[0][1].class_id).toBe(0);
  });

  test("create mode is unchanged: a non-admin without a class cannot create", async () => {
    mockState = { loginUser: { userType: "FACULTY", facultyType: "TEACHER", LessonId: 701 }, course: { selectedCourseId: 501 } };
    render(<ResourceComposer back={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Resource title"), { target: { value: "New" } });
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: "notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Resource" }));
    expect(await screen.findByText("A class assignment is required to add Resources.")).toBeInTheDocument();
    expect(createLessonContent).not.toHaveBeenCalled();
    expect(updateLessonContent).not.toHaveBeenCalled();
  });
});
