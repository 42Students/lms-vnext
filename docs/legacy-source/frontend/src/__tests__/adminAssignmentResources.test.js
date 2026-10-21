import {
  buildAdminAssignmentContentData,
  prepareAdminAssignmentEditor,
} from "@/utils/adminAssignmentResources";

const file = {
  id: "file-1", type: "FILE", title: "Reference", file_dto: {
    size: 350, original_name: "reference.docx", mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    cloud_storage_object: "org-2/college-9/assignments/reference.docx",
  },
};
const pdf = {
  id: "pdf-1", type: "PDF", title: "Worksheet", file_dto: {
    size: 140, original_name: "worksheet.pdf", mimetype: "application/pdf",
    cloud_storage_object: "org-2/college-9/assignments/worksheet.pdf",
  },
};
const link = { id: "link-1", type: "LINK", title: "Docs", link: "https://example.org/docs" };

const serialize = (options = {}) => buildAdminAssignmentContentData({
  description: "<p>Read carefully</p>", resources: [file, pdf, link],
  submissionTypes: ["WRITTEN_RESPONSE", "PDF_UPLOAD", "FILE_UPLOAD", "EXTERNAL_LINK"],
  ...options,
});

describe("college and super-admin assignment resource parity", () => {
  it("serializes multiple file, PDF, and link resources plus learner submission methods", () => {
    const data = serialize();
    expect(data.assignment_resources).toEqual([
      expect.objectContaining({ type: "INSTRUCTIONS", text: "<p>Read carefully</p>" }),
      expect.objectContaining({ type: "FILE", file_dto: expect.objectContaining({ cloud_storage_object: file.file_dto.cloud_storage_object }) }),
      expect.objectContaining({ type: "PDF", file_dto: expect.objectContaining({ original_name: "worksheet.pdf" }) }),
      expect.objectContaining({ type: "LINK", link: link.link }),
    ]);
    expect(data.allowed_submission_types).toEqual(["WRITTEN_RESPONSE", "PDF_UPLOAD", "FILE_UPLOAD", "EXTERNAL_LINK"]);
    expect(data.file_dto.cloud_storage_object).toBe(file.file_dto.cloud_storage_object);
  });

  it("loads existing faculty resources and submission types in the admin editor", () => {
    const data = serialize();
    const hydrated = prepareAdminAssignmentEditor({
      assignmentResources: data.assignment_resources.map((r) => ({ ...r,
        fileDTO: r.file_dto ? { cloudStorageObject: r.file_dto.cloud_storage_object, originalName: r.file_dto.original_name } : null,
      })),
      allowedSubmissionTypes: data.allowed_submission_types,
    });
    expect(hydrated.description).toBe("<p>Read carefully</p>");
    expect(hydrated.otherResources).toHaveLength(3);
    expect(hydrated.otherResources[0].file_dto.cloud_storage_object).toBe(file.file_dto.cloud_storage_object);
    expect(hydrated.submissionTypes).toContain("FILE_UPLOAD");
  });

  it("refuses unfinished attachments and unsafe links", () => {
    expect(() => serialize({ resources: [{ ...file, file_dto: {} }] })).toThrow(/Finish uploading/);
    expect(() => serialize({ resources: [{ ...link, link: "javascript:alert(1)" }] })).toThrow(/https/);
    expect(() => serialize({ resources: [{ ...pdf, file_dto: { ...pdf.file_dto, original_name: "fake.exe" } }] })).toThrow(/PDF/);
  });

  it("requires valid submission methods and at least one resource", () => {
    expect(() => serialize({ submissionTypes: [] })).toThrow(/submission method/);
    expect(() => serialize({ submissionTypes: ["NOT_A_TYPE"] })).toThrow(/submission method/);
    expect(() => serialize({ description: "", resources: [] })).toThrow(/Add instructions/);
  });

  it("enforces the combined maximum of thirty resources", () => {
    expect(() => serialize({ resources: Array.from({ length: 30 }, (_, i) => ({ ...link, id: `link-${i}` })) }))
      .toThrow(/maximum 30/);
  });

  it("preserves unrelated content fields on edit and supports removing a resource", () => {
    const result = serialize({ resources: [pdf], previousData: { allow_discussions: true, calendar_event_id: "event-1" } });
    expect(result.allow_discussions).toBe(true);
    expect(result.calendar_event_id).toBe("event-1");
    expect(result.assignment_resources.map((r) => r.type)).toEqual(["INSTRUCTIONS", "PDF"]);
  });
});
