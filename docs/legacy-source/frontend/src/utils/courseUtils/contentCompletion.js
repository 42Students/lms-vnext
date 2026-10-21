// Shared "is this lesson content done" rule for the two learner-facing viewing surfaces
// (syllabus.js's roadmap + modal viewer, and syllabusDetail.js's full lesson page) -- they were
// drifting: syllabusDetail.js's lesson progress bar only ever checked progressByContentId, so an
// assignment the learner had actually submitted counted as "not done" there even after syllabus.js
// learned to check submittedAssignmentIds. Centralizing this rule keeps both in sync going forward.
//
// `normalizeType` is passed in rather than imported because syllabus.js and syllabusDetail.js each
// keep their own normalizeContentType with slightly different edge-case mappings; unifying those
// too is a bigger, riskier change than fixing what's actually broken here.
export function isLearnerContentComplete(content, { normalizeType, progressByContentId, submittedAssignmentIds }) {
  const type = normalizeType(content?.contentType ?? content?.content_type);
  const id = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;

  if (type === "quiz") {
    return Boolean(content?.submitted);
  }
  if (type === "assignment") {
    return id != null && Boolean(submittedAssignmentIds?.has(id));
  }
  if (id == null) return false;
  const entry = progressByContentId?.[id];
  if (!entry) return false;
  return Boolean(entry.completedAt) || entry.status === "WATCHED";
}

// Content types with no watched-percentage or submission of their own to measure completion by.
// The backend already honors a bare {completed: true} self-report for exactly these types (see
// LearnerContentProgressServiceImpl#saveProgress's isTimedContentType check) -- "video"/"youtube"
// are deliberately excluded since a bare client flag there would forge a watch.
export const MARK_COMPLETE_ELIGIBLE_TYPES = new Set([
  "resource",
  "live_class",
]);
