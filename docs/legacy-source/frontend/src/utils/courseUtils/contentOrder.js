export function normalizeContentSequence(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getContentSortValue(content) {
  const sequence =
    normalizeContentSequence(content?.sequence ?? content?.order ?? content?.sortOrder ?? content?.sort_order);
  if (sequence != null) return { rank: 0, value: sequence };

  const createdAt = content?.createdAt ?? content?.created_at ?? content?.uploadedAt ?? content?.uploaded_at ?? null;
  if (createdAt) {
    const timestamp = new Date(createdAt).getTime();
    if (Number.isFinite(timestamp)) return { rank: 1, value: timestamp };
  }

  const id = normalizeContentSequence(content?.id ?? content?.lessonContentId ?? content?.lesson_content_id);
  if (id != null) return { rank: 2, value: id };

  return { rank: 3, value: 0 };
}

export function sortLessonContents(contents = []) {
  return [...(Array.isArray(contents) ? contents : [])].sort((left, right) => {
    const leftSort = getContentSortValue(left);
    const rightSort = getContentSortValue(right);
    if (leftSort.rank !== rightSort.rank) return leftSort.rank - rightSort.rank;
    if (leftSort.value !== rightSort.value) return leftSort.value - rightSort.value;
    return normalizeContentSequence(left?.id ?? left?.lessonContentId ?? left?.lesson_content_id) -
      normalizeContentSequence(right?.id ?? right?.lessonContentId ?? right?.lesson_content_id);
  });
}
