export const ASSIGNMENT_RESOURCE_TYPES = {
  INSTRUCTIONS: "INSTRUCTIONS",
  PDF: "PDF",
  FILE: "FILE",
  LINK: "LINK",
};

export const ASSIGNMENT_SUBMISSION_TYPES = {
  WRITTEN_RESPONSE: "WRITTEN_RESPONSE",
  PDF_UPLOAD: "PDF_UPLOAD",
  FILE_UPLOAD: "FILE_UPLOAD",
  REPOSITORY_LINK: "REPOSITORY_LINK",
  EXTERNAL_LINK: "EXTERNAL_LINK",
};

export const ASSIGNMENT_SUBMISSION_OPTIONS = [
  { value: ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE, label: "Written Response" },
  { value: ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD, label: "PDF Upload" },
  { value: ASSIGNMENT_SUBMISSION_TYPES.FILE_UPLOAD, label: "File Upload" },
  { value: ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK, label: "Repository Link" },
  { value: ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK, label: "Website / External Link" },
];

export const ASSIGNMENT_RESOURCE_OPTIONS = [
  { value: ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS, label: "Instructions" },
  { value: ASSIGNMENT_RESOURCE_TYPES.PDF, label: "PDF" },
  { value: ASSIGNMENT_RESOURCE_TYPES.FILE, label: "File" },
  { value: ASSIGNMENT_RESOURCE_TYPES.LINK, label: "Link" },
];

export function isSingleInstanceResourceType(type) {
  return type === ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS;
}

export function createEmptyResource(type) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title: "",
    text: "",
    link: "",
    file_dto: {
      size: 0,
      encoding: "",
      mimetype: "",
      field_name: "",
      original_name: "",
      cloud_storage_object: "",
    },
  };
}

export function hasMeaningfulHtmlContent(value) {
  if (!value || typeof value !== "string") return false;
  const normalized = value
    .replace(/&nbsp;/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0;
}

export function normalizeAssignmentResources(contentDataDTO) {
  const resources = Array.isArray(contentDataDTO?.assignment_resources)
    ? contentDataDTO.assignment_resources
    : Array.isArray(contentDataDTO?.assignmentResources)
      ? contentDataDTO.assignmentResources
      : [];
  if (resources.length > 0) {
    return resources.map((resource, index) => ({
      id: resource?.id || `resource-${index}`,
      type: resource?.type || ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS,
      title: resource?.title || "",
      text: resource?.text || "",
      link: resource?.link || "",
      file_dto: {
        size: resource?.file_dto?.size || resource?.fileDTO?.size || 0,
        encoding: resource?.file_dto?.encoding || resource?.fileDTO?.encoding || "",
        mimetype: resource?.file_dto?.mimetype || resource?.fileDTO?.mimetype || "",
        field_name: resource?.file_dto?.field_name || resource?.fileDTO?.fieldName || "",
        original_name: resource?.file_dto?.original_name || resource?.fileDTO?.originalName || "",
        cloud_storage_object: resource?.file_dto?.cloud_storage_object || resource?.fileDTO?.cloudStorageObject || "",
      },
    }));
  }

  const legacyResources = [];
  if (hasMeaningfulHtmlContent(contentDataDTO?.html_content || contentDataDTO?.htmlContent)) {
    legacyResources.push({
      id: "legacy-instructions",
      type: ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS,
      title: "Instructions",
      text: contentDataDTO?.html_content || contentDataDTO?.htmlContent || "",
      link: "",
      file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
    });
  }

  const legacyFileKey = contentDataDTO?.file_dto?.cloud_storage_object || contentDataDTO?.fileDTO?.cloudStorageObject || "";
  if (legacyFileKey) {
    const originalName = contentDataDTO?.file_dto?.original_name || contentDataDTO?.fileDTO?.originalName || "";
    const isPdf = /\.pdf($|\?)/i.test(originalName || legacyFileKey);
    legacyResources.push({
      id: "legacy-file",
      type: isPdf ? ASSIGNMENT_RESOURCE_TYPES.PDF : ASSIGNMENT_RESOURCE_TYPES.FILE,
      title: originalName || (isPdf ? "Assignment PDF" : "Assignment File"),
      text: "",
      link: "",
      file_dto: {
        size: contentDataDTO?.file_dto?.size || contentDataDTO?.fileDTO?.size || 0,
        encoding: contentDataDTO?.file_dto?.encoding || contentDataDTO?.fileDTO?.encoding || "",
        mimetype: contentDataDTO?.file_dto?.mimetype || contentDataDTO?.fileDTO?.mimetype || "",
        field_name: contentDataDTO?.file_dto?.field_name || contentDataDTO?.fileDTO?.fieldName || "",
        original_name: originalName,
        cloud_storage_object: legacyFileKey,
      },
    });
  }

  const legacyLink = contentDataDTO?.link || "";
  if (legacyLink) {
    legacyResources.push({
      id: "legacy-link",
      type: ASSIGNMENT_RESOURCE_TYPES.LINK,
      title: "Reference Link",
      text: "",
      link: legacyLink,
      file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
    });
  }

  return legacyResources;
}

export function normalizeAllowedSubmissionTypes(contentDataDTO) {
  const configured = Array.isArray(contentDataDTO?.allowed_submission_types)
    ? contentDataDTO.allowed_submission_types
    : Array.isArray(contentDataDTO?.allowedSubmissionTypes)
      ? contentDataDTO.allowedSubmissionTypes
      : [];
  if (configured.length > 0) return configured;

  const fallback = [];
  if (hasMeaningfulHtmlContent(contentDataDTO?.html_content || contentDataDTO?.htmlContent)) {
    fallback.push(ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE);
  }
  const fileKey = contentDataDTO?.file_dto?.cloud_storage_object || contentDataDTO?.fileDTO?.cloudStorageObject || "";
  if (fileKey) {
    fallback.push(ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD);
  }
  return fallback.length > 0 ? fallback : [ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD];
}

export function getSubmissionTypeLabel(value) {
  return ASSIGNMENT_SUBMISSION_OPTIONS.find((option) => option.value === value)?.label || value;
}

// Reshapes a learner's own submission (from getSubmittedAssign / getAssignmentSubmissions) into
// the same resource-card shape normalizeAssignmentResources produces, so ViewAssignmentModal can
// render "what I submitted" through the exact same ResourceCard renderer as "what I was given".
export function normalizeSubmissionResources(submission) {
  const assets = Array.isArray(submission?.submissionAssets)
    ? submission.submissionAssets
    : Array.isArray(submission?.submission_assets)
      ? submission.submission_assets
      : [];

  if (assets.length > 0) {
    return assets.map((asset, index) => {
      const type = asset?.type;
      const fileDto = asset?.file_dto || asset?.fileDTO || null;
      if (type === ASSIGNMENT_SUBMISSION_TYPES.WRITTEN_RESPONSE) {
        return {
          id: asset?.id || `submission-written-${index}`,
          type: ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS,
          title: asset?.title || "Written Response",
          text: submission?.htmlContent || submission?.html_content || "",
          link: "",
          file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
        };
      }
      if (type === ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK || type === ASSIGNMENT_SUBMISSION_TYPES.EXTERNAL_LINK) {
        return {
          id: asset?.id || `submission-link-${index}`,
          type: ASSIGNMENT_RESOURCE_TYPES.LINK,
          title: asset?.title || (type === ASSIGNMENT_SUBMISSION_TYPES.REPOSITORY_LINK ? "Repository Link" : "External Link"),
          text: "",
          link: asset?.link || "",
          file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
        };
      }
      return {
        id: asset?.id || `submission-file-${index}`,
        type: type === ASSIGNMENT_SUBMISSION_TYPES.PDF_UPLOAD ? ASSIGNMENT_RESOURCE_TYPES.PDF : ASSIGNMENT_RESOURCE_TYPES.FILE,
        title: asset?.title || fileDto?.original_name || fileDto?.originalName || "Submitted File",
        text: "",
        link: "",
        file_dto: {
          size: fileDto?.size || 0,
          encoding: fileDto?.encoding || "",
          mimetype: fileDto?.mimetype || "",
          field_name: fileDto?.field_name || fileDto?.fieldName || "",
          original_name: fileDto?.original_name || fileDto?.originalName || "",
          cloud_storage_object: fileDto?.cloud_storage_object || fileDto?.cloudStorageObject || "",
        },
      };
    });
  }

  // Legacy single-asset submissions predate the multi-part submission_assets array — the whole
  // record itself is the one submission.
  const legacy = [];
  const htmlContent = submission?.htmlContent || submission?.html_content;
  if (hasMeaningfulHtmlContent(htmlContent)) {
    legacy.push({
      id: "legacy-submission-written",
      type: ASSIGNMENT_RESOURCE_TYPES.INSTRUCTIONS,
      title: "Written Response",
      text: htmlContent,
      link: "",
      file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
    });
  }
  const legacyFileDto = submission?.fileDTO || submission?.file_dto || submission?.fileDto;
  const legacyFileKey = legacyFileDto?.cloud_storage_object || legacyFileDto?.cloudStorageObject || "";
  if (legacyFileKey) {
    const originalName = legacyFileDto?.original_name || legacyFileDto?.originalName || "";
    const isPdf = /\.pdf($|\?)/i.test(originalName || legacyFileKey);
    legacy.push({
      id: "legacy-submission-file",
      type: isPdf ? ASSIGNMENT_RESOURCE_TYPES.PDF : ASSIGNMENT_RESOURCE_TYPES.FILE,
      title: originalName || "Submitted File",
      text: "",
      link: "",
      file_dto: {
        size: legacyFileDto?.size || 0,
        encoding: legacyFileDto?.encoding || "",
        mimetype: legacyFileDto?.mimetype || "",
        field_name: legacyFileDto?.field_name || legacyFileDto?.fieldName || "",
        original_name: originalName,
        cloud_storage_object: legacyFileKey,
      },
    });
  }
  const legacyLink = submission?.submissionLink || submission?.submission_link || "";
  if (legacyLink) {
    legacy.push({
      id: "legacy-submission-link",
      type: ASSIGNMENT_RESOURCE_TYPES.LINK,
      title: "Submission Link",
      text: "",
      link: legacyLink,
      file_dto: createEmptyResource(ASSIGNMENT_RESOURCE_TYPES.FILE).file_dto,
    });
  }
  return legacy;
}

export function isPdfResource(resource) {
  if (!resource) return false;
  if (resource.type === ASSIGNMENT_RESOURCE_TYPES.PDF) return true;
  const originalName = resource?.file_dto?.original_name || "";
  const storageKey = resource?.file_dto?.cloud_storage_object || "";
  return /\.pdf($|\?)/i.test(originalName || storageKey);
}
