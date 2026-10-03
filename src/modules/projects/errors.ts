export type ProjectsServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "PROJECT_TEMPLATE_NOT_FOUND"
  | "PROJECT_TEMPLATE_SLUG_CONFLICT"
  | "PROJECT_TEMPLATE_ARCHIVED"
  | "PROJECT_TEMPLATE_NOT_PUBLISHED"
  | "PROJECT_TEMPLATE_VERSION_NOT_FOUND"
  | "PROJECT_TEMPLATE_HAS_ACTIVE_ASSIGNMENTS"
  | "PROJECT_TEMPLATE_ASSIGNMENT_NOT_FOUND"
  | "PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT"
  | "PROJECT_TEMPLATE_NOT_ASSIGNED"
  | "PROJECT_NOT_FOUND"
  | "PROJECT_SLUG_CONFLICT";

export class ProjectsServiceError extends Error {
  constructor(
    public readonly code: ProjectsServiceErrorCode,
  ) {
    super(code);
    this.name = "ProjectsServiceError";
  }
}

export function postgresConstraintName(
  error: unknown,
) {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!current || typeof current !== "object") {
      return null;
    }

    if (
      "constraint" in current &&
      typeof (current as { constraint?: unknown })
        .constraint === "string"
    ) {
      return (current as { constraint: string })
        .constraint;
    }

    if ("cause" in current) {
      current = (current as { cause?: unknown }).cause;
      continue;
    }

    return null;
  }

  return null;
}
