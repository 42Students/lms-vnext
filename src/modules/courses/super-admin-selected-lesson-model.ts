/** Acting-college switches invalidate client-selected lesson IDs. Never
 * retain selection from another college when authorized choices change. */
export function resolveSuperAdminAuthoringLesson<T extends {id:string}>(
 lessons:readonly T[],selectedLessonId:string,
):T|undefined {
 return lessons.find(lesson=>lesson.id===selectedLessonId)??lessons[0];
}
