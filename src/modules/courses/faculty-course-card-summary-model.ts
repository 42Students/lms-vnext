type ScopedContentRow = {
  lessonId: string;
  deliveryId: string | null;
  status: string;
};

export function countFacultyCourseCardItems(input: {
  lessonIds: ReadonlySet<string>;
  deliveryId: string;
  contents: readonly ScopedContentRow[];
  assignments: readonly ScopedContentRow[];
  quizzes: readonly ScopedContentRow[];
}) {
  const visible = (rows: readonly ScopedContentRow[]) => rows.filter((row) =>
    input.lessonIds.has(row.lessonId) &&
    (row.deliveryId === null || row.deliveryId === input.deliveryId));
  const contents = visible(input.contents);
  const assignments = visible(input.assignments);
  const quizzes = visible(input.quizzes);
  const statuses = [
    ...contents.map((row) => row.status),
    ...assignments.map((row) => row.status),
    ...quizzes.map((row) => row.status),
  ];
  return {
    lessons: input.lessonIds.size,
    contents: contents.length,
    assignments: assignments.length,
    quizzes: quizzes.length,
    draftItems: statuses.filter((status) => status === "DRAFT").length,
    publishedItems: statuses.filter((status) => status === "PUBLISHED").length,
  };
}
