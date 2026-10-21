// Admin assignment rows are intentionally lightweight. Before an edit, fetch the full
// lesson-content record and use this serializer to preserve faculty-created resources,
// submission settings, and class ownership. Sending only { html_content } would replace
// the complete content_data JSON and silently delete those settings.
const read = (object, camel, snake) =>
  object?.[camel] !== undefined ? object[camel] : object?.[snake];

const serializeFile = (file) => {
  if (!file) return undefined;
  return {
    size: read(file, "size", "size") ?? 0,
    encoding: read(file, "encoding", "encoding") ?? "",
    mimetype: read(file, "mimetype", "mimetype") ?? "",
    field_name: read(file, "fieldName", "field_name") ?? "",
    original_name: read(file, "originalName", "original_name") ?? "",
    cloud_storage_object: read(file, "cloudStorageObject", "cloud_storage_object") ?? "",
  };
};

export function buildAdminAssignmentUpdatePayload(existing, values) {
  const lessonId = Number(read(existing, "lessonId", "lesson_id"));
  const courseId = Number(read(existing, "courseId", "course_id"));
  if (!existing || !Number.isSafeInteger(lessonId) || lessonId < 1 || !Number.isSafeInteger(courseId) || courseId < 1) {
    throw new Error("Assignment details could not be loaded. Refresh and retry.");
  }

  const current = read(existing, "contentDataDTO", "content_data_dto") || {};
  const content = {};
  const scalarFields = [
    ["allowDiscussions", "allow_discussions"],
    ["viewAfterSchedule", "view_after_schedule"],
    ["viewBeforeSchedule", "view_before_schedule"],
    ["text", "text"],
    ["duration", "duration"],
    ["link", "link"],
    ["calendarEventId", "calendar_event_id"],
    ["timeZone", "time_zone"],
    ["endTime", "end_time"],
    ["startTime", "start_time"],
    ["thumbnail", "thumbnail"],
  ];
  for (const [camel, snake] of scalarFields) {
    const value = read(current, camel, snake);
    if (value !== undefined) content[snake] = value;
  }

  const file = serializeFile(read(current, "fileDTO", "file_dto"));
  if (file) content.file_dto = file;

  const resources = read(current, "assignmentResources", "assignment_resources");
  if (Array.isArray(resources)) {
    content.assignment_resources = resources.map((resource) => ({
      id: resource.id,
      type: resource.type,
      title: resource.title,
      text: resource.text,
      link: resource.link,
      ...(serializeFile(read(resource, "fileDTO", "file_dto"))
        ? { file_dto: serializeFile(read(resource, "fileDTO", "file_dto")) }
        : {}),
    }));
  }
  const submissionTypes = read(current, "allowedSubmissionTypes", "allowed_submission_types");
  if (Array.isArray(submissionTypes)) content.allowed_submission_types = submissionTypes;

  const deadline = values.deadline;
  content.html_content = values.description ?? "";
  // Keep the legacy due_date used by the learner view consistent with the DB deadline.
  content.due_date = deadline ? deadline.toISOString() : "";

  const facultyId = read(existing, "facultyId", "faculty_id");
  // Editing an assignment must preserve its existing ownership scope. The edit form can briefly
  // carry the "shared course" default while class options are loading; letting that value win would
  // silently convert a class assignment into a shared assignment.
  const classId = read(existing, "classId", "class_id") ?? values.classId;
  const sequence = existing.sequence;
  return {
    lesson_id: lessonId,
    course_id: courseId,
    content_type: "ASSIGNMENT",
    content_title: values.contentTitle,
    points: values.points ?? 0,
    deadline: deadline ? deadline.format("YYYY-MM-DDTHH:mm:ss") : null,
    clear_deadline: !deadline && Boolean(existing.deadline),
    content_data_dto: content,
    ...(facultyId != null ? { faculty_id: facultyId } : {}),
    class_id: classId ?? 0,
    ...(sequence > 0 ? { sequence } : {}),
    enabled: existing.enabled ?? true,
    active: existing.active ?? true,
  };
}
