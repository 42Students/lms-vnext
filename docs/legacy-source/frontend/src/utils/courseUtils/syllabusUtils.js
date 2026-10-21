import Api from "@/api/ApiMethod";

/**
 * Deletes a lesson content by ID using the DELETE API (sends JWT).
 * @param {string} type - Content type (e.g. "YOUTUBE") - kept for API compatibility
 * @param {Object} selectedContent - Content object with id
 * @param {number} facultyId - Faculty ID - kept for API compatibility
 */
export default async function deleteLessonContent(
  type,
  selectedContent,
  facultyId
) {
  const id = selectedContent?.id;
  if (!id) {
    return Promise.reject(new Error("Lesson content id is required"));
  }
  try {
    await Api.delete(`/api/v1/lesson/contents/delete/${id}`);
    return Promise.resolve(true);
  } catch (err) {
    return Promise.reject(err);
  }
}
