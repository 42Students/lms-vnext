import {
  ASSIGNMENT_RESOURCE_TYPES,
  ASSIGNMENT_SUBMISSION_TYPES,
  hasMeaningfulHtmlContent,
  normalizeAssignmentResources,
  normalizeAllowedSubmissionTypes,
} from "@/utils/assignmentSchema";

const RESOURCE_TYPES = new Set(Object.values(ASSIGNMENT_RESOURCE_TYPES));
const SUBMISSION_TYPES = new Set(Object.values(ASSIGNMENT_SUBMISSION_TYPES));

export function prepareAdminAssignmentEditor(contentData, fallbackDescription = "") {
  const data = contentData || {};
  const resources = normalizeAssignmentResources(data);
  const instructions = resources.find((r) => r.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS);
  const otherResources = resources.filter((r) => r.type !== ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS);
  return {
    description: instructions?.text || data.htmlContent || data.html_content || fallbackDescription || "",
    otherResources,
    submissionTypes: normalizeAllowedSubmissionTypes(data),
  };
}

export function buildAdminAssignmentContentData({ description, resources = [], submissionTypes = [], deadline, previousData = {} }) {
  const cleanedDescription = String(description || "").trim();
  const instructions = hasMeaningfulHtmlContent(cleanedDescription)
    ? [{ id: "admin-instructions", type: ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS, title: "Instructions", text: cleanedDescription, link: "", file_dto: null }]
    : [];
  const normalized = [...instructions];
  if (!Array.isArray(resources) || resources.length + instructions.length > 30) {
    throw new Error("Too many assignment resources (maximum 30).");
  }
  for (const resource of resources) {
    if (!RESOURCE_TYPES.has(resource?.type) || resource.type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS) {
      throw new Error("Unknown assignment resource type.");
    }
    const title = String(resource.title || "").trim();
    if (!title || title.length > 255) throw new Error("Give each assignment resource a title (up to 255 characters).");
    const result = { id: resource.id, type: resource.type, title, text: "", link: "", file_dto: null };
    if (resource.type === ASSIGNMENT_RESOURCE_TYPES.LINK) {
      const link = String(resource.link || "").trim();
      if (!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(link)) throw new Error("Resource links must start with https:// and have a valid host.");
      result.link = link;
    } else {
      const file = resource.file_dto || {};
      if (!file.cloud_storage_object) throw new Error("Finish uploading every attachment before saving.");
      result.file_dto = {
        size: file.size || 0,
        encoding: file.encoding || "",
        mimetype: file.mimetype || "",
        field_name: file.field_name || "",
        original_name: file.original_name || "",
        cloud_storage_object: file.cloud_storage_object,
      };
      if (resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF &&
          !/\.pdf$/i.test(result.file_dto.original_name || "")) {
        throw new Error("PDF resources require a PDF file.");
      }
    }
    normalized.push(result);
  }
  if (normalized.length === 0) throw new Error("Add instructions or at least one assignment resource.");
  if (!Array.isArray(submissionTypes) || submissionTypes.length === 0 ||
      submissionTypes.some((t) => !SUBMISSION_TYPES.has(t))) {
    throw new Error("Choose at least one valid learner submission method.");
  }
  const firstFile = normalized.find((r) => [ASSIGNMENT_RESOURCE_TYPES.PDF, ASSIGNMENT_RESOURCE_TYPES.FILE].includes(r.type));
  const firstLink = normalized.find((r) => r.type === ASSIGNMENT_RESOURCE_TYPES.LINK);
  return {
    ...previousData,
    html_content: cleanedDescription,
    file_dto: firstFile?.file_dto || null,
    link: firstLink?.link || "",
    assignment_resources: normalized,
    allowed_submission_types: [...new Set(submissionTypes)],
    due_date: deadline ? deadline.toISOString() : "",
  };
}
