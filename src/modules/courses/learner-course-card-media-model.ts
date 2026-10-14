/** Per-course thumbnail is not yet a migrated field; never fabricate an authored image. */
export function learnerCourseFallbackMedia() {
  return {src:"/assets/images/common/course.svg",source:"FALLBACK" as const};
}
