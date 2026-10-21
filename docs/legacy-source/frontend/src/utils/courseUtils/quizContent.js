export function normalizeQuizContent(quiz) {
  if (!quiz) return null;

  const quizId = quiz?.id ?? quiz?.quizId ?? quiz?.quiz_id ?? quiz?.lessonContentId ?? quiz?.lesson_content_id;
  if (quizId == null) return null;

  const title = quiz?.title ?? quiz?.quizTitle ?? quiz?.quiz_title ?? "Untitled quiz";
  const lessonId = quiz?.lessonId ?? quiz?.lesson_id ?? quiz?.lesson?.id ?? null;
  const questions = Array.isArray(quiz?.questions)
    ? quiz.questions
    : Array.isArray(quiz?.quizDTO?.questions)
      ? quiz.quizDTO.questions
      : Array.isArray(quiz?.quiz_dto?.questions)
        ? quiz.quiz_dto.questions
        : [];

  const contentDataDTO = {
    dueDate: quiz?.dueAt ?? quiz?.due_date ?? quiz?.dueDate ?? null,
    totalPoints: quiz?.totalPoints ?? quiz?.points ?? quiz?.maxPoints ?? null,
    points: quiz?.totalPoints ?? quiz?.points ?? quiz?.maxPoints ?? null,
    file_dto: quiz?.file_dto ?? quiz?.fileDTO ?? quiz?.fileDto ?? null,
  };

  return {
    ...quiz,
    id: quizId,
    quizId,
    quiz_id: quizId,
    lessonContentId: quizId,
    lesson_content_id: quizId,
    courseId: quiz?.courseId ?? quiz?.course_id ?? quiz?.course?.id ?? null,
    course_id: quiz?.courseId ?? quiz?.course_id ?? quiz?.course?.id ?? null,
    classId: quiz?.classId ?? quiz?.class_id ?? quiz?.class?.id ?? null,
    class_id: quiz?.classId ?? quiz?.class_id ?? quiz?.class?.id ?? null,
    courseSlug: quiz?.courseSlug ?? quiz?.course_slug ?? quiz?.course?.slug ?? null,
    course_slug: quiz?.courseSlug ?? quiz?.course_slug ?? quiz?.course?.slug ?? null,
    contentType: "quiz",
    content_type: "quiz",
    contentTitle: title,
    content_title: title,
    contentDataDTO,
    content_data_dto: contentDataDTO,
    quizDTO: quiz?.quizDTO ?? quiz?.quiz_dto ?? (questions.length > 0 ? { questions } : undefined),
    lessonId,
    lesson_id: lessonId,
    enabled: quiz?.enabled ?? true,
    active: quiz?.active ?? true,
  };
}

export function mergeQuizContentsIntoLessons(lessons = [], quizzes = []) {
  const quizzesByLessonId = new Map();

  (Array.isArray(quizzes) ? quizzes : []).forEach((quiz) => {
    const normalized = normalizeQuizContent(quiz);
    if (!normalized) return;
    const lessonId = Number(normalized.lessonId ?? normalized.lesson_id);
    if (!Number.isFinite(lessonId) || lessonId <= 0) return;
    const existing = quizzesByLessonId.get(lessonId) ?? [];
    existing.push(normalized);
    quizzesByLessonId.set(lessonId, existing);
  });

  return (Array.isArray(lessons) ? lessons : []).map((lessonWrapper) => {
    const lesson = lessonWrapper?.lesson ?? lessonWrapper;
    const lessonId = Number(lesson?.id ?? lesson?.lessonId ?? lesson?.lesson_id);
    const lessonContents = [
      ...(lessonWrapper?.lessonContents ?? lessonWrapper?.lesson_contents ?? lessonWrapper?.contents ?? []),
    ];

    const existingKeys = new Set(
      lessonContents.map((content) => String(
        content?.id ?? content?.lessonContentId ?? content?.lesson_content_id ?? content?.quizId ?? content?.quiz_id ?? ""
      )).filter(Boolean)
    );

    (quizzesByLessonId.get(lessonId) ?? []).forEach((quiz) => {
      const quizKey = String(quiz?.id ?? quiz?.lessonContentId ?? quiz?.lesson_content_id ?? "");
      if (!quizKey || existingKeys.has(quizKey)) return;
      lessonContents.push(quiz);
    });

    return {
      ...lessonWrapper,
      lessonContents,
      lesson_contents: lessonContents,
      contents: lessonContents,
    };
  });
}
