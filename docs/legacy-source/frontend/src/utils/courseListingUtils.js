import { learnerAvailability } from "@/utils/courseUtils/contentAvailability";

const FALLBACK_IMAGE = "/assets/images/course/learn-ability.svg";

export { FALLBACK_IMAGE };

export function courseHref(basePath, course, isTeacher) {
  // Only invalid identifiers and unusable Faculty assignments block navigation.
  // A learner course with a valid ID/slug but no title remains authorized and openable.
  if (course?.invalidRecord || (isTeacher && course?.metadataIncomplete && !course?.hasCourse)) return null;
  if (!isTeacher && !learnerAvailability(course).actionable) return null;
  const slug = course?.slug;
  const identifier = slug || course?.id;
  if (identifier == null || String(identifier).trim() === "" ||
      String(identifier) === "undefined" || String(identifier) === "null") return null;
  // Links straight to /home instead of the bare course path. The bare path
  // (src/pages/{learn,teacher}/courses/[courseId]/index.js) exists only as a fallback for a
  // typed/bookmarked/externally-linked URL with no tab -- it client-redirects to /home itself,
  // which meant every click from this list (the primary way a course is ever opened) mounted the
  // bare route, rendered its skeleton, fired a router.replace, then mounted /home and rendered
  // ITS OWN skeleton before real content ever appeared. Two mounts and a URL flip for a
  // navigation that only ever goes one place.
  const path = `${basePath}/courses/${encodeURIComponent(String(identifier))}/home`;
  if (!isTeacher) return path;
  const params = [];
  if (course?.clsid != null && String(course.clsid).trim() !== "") {
    params.push(`cls=${encodeURIComponent(String(course.clsid))}`);
  }
  if (!slug) params.push("ref=course");
  return params.length ? `${path}?${params.join("&")}` : path;
}

export function sectionKey(course) {
  if (course?.clsid != null && String(course.clsid).trim() !== "") return `id:${course.clsid}`;
  return `legacy:${course?.batchName || ""}:${course?.academicYear || ""}:${course?.sectionName || "Unknown"}`;
}

export function searchCourses(courses, term) {
  const query = String(term || "").trim().toLocaleLowerCase();
  if (!query) return courses;
  return courses.filter((course) => [course?.name, course?.faculty, course?.sectionName,
      course?.batchName, course?.courseCode, course?.academicYear,
      ...(Array.isArray(course?.instructors) ? course.instructors.map((person) => person?.name) : [])]
    .some((value) => String(value ?? "").toLocaleLowerCase().includes(query)));
}

/** "core" = the learner's regular section courses; "elective" = anything group-backed. */
export function filterByCourseType(courses, type) {
  if (type === "core") return courses.filter((course) => !course?.isElective);
  if (type === "elective") return courses.filter((course) => !!course?.isElective);
  return courses;
}

export function safeCredits(value) {
  if (value == null || value === "") return 0;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

/** Do not conflate a genuine empty curriculum with broken learner academic setup. */
export function academicConfigurationMessage(status) {
  const messages = {
    NO_CLASS: "Your class is not configured. Please contact your administrator.",
    CLASS_NOT_FOUND: "Your assigned class is missing. Please contact your administrator.",
    NO_BATCH: "Your class has no batch. Please contact your administrator.",
    BATCH_NOT_FOUND: "Your assigned batch is missing. Please contact your administrator.",
    NO_PROGRAM: "Your batch has no program. Please contact your administrator.",
    PROGRAM_NOT_FOUND: "Your assigned program is missing. Please contact your administrator.",
    NO_SEMESTER: "Your current semester is not configured. Please contact your administrator.",
  };
  return messages[status] || null;
}

/** Corrupt rows must be visible as unavailable, never silently discarded or navigable. */
export function normalizedLearnerCourses(data, fallbackClassId) {
  const seen = new Set();
  return (data.courses || []).map((course, index) => {
    if (!course || typeof course !== "object" || Array.isArray(course)) {
      return { id: null, slug: null, clsid: null, invalidRecord: true,
        name: `Invalid course record ${index + 1}`, image: FALLBACK_IMAGE, credits: null };
    }
    const identifier = course.id == null ? course.slug || course.course_slug : String(course.id);
    const key = identifier == null || String(identifier).trim() === "" ? null : String(identifier);
    if (key == null) {
      return { id: null, slug: null, clsid: null, invalidRecord: true,
        name: `Course identifier missing ${index + 1}`, image: FALLBACK_IMAGE, credits: null };
    }
    if (seen.has(key)) {
      return { id: null, slug: null, clsid: null, invalidRecord: true,
        name: `Duplicate course mapping ${index + 1}`, image: FALLBACK_IMAGE, credits: null };
    }
    seen.add(key);
    const instructors = Array.isArray(course.instructors)
      ? course.instructors.filter((person) => person && typeof person.name === "string" && person.name.trim())
      : [];
    const hasName = typeof course.course_name === "string" && !!course.course_name.trim();
    return {
      // Each card carries the class it is taught in: the learner's section, or for an elective the
      // offering's group-backed class. Older backends only send the section id at the top level.
      clsid: course.class_id ?? data.class_id ?? fallbackClassId,
      isElective: course.is_elective === true,
      electiveSlotName: course.elective_slot_name || null,
      id: course.id ?? null,
      slug: course.slug || course.course_slug || null,
      name: hasName ? course.course_name : "Course name unavailable",
      metadataIncomplete: !hasName,
      courseCode: course.course_code || "",
      image: course.image_url || FALLBACK_IMAGE,
      instructors,
      faculty: instructors.length ? instructors.map((person) => person.name.trim()).join(", ")
        : course.faculty?.name || null,
      credits: course.credits,
      active: course.active,
      enabled: course.enabled,
      published: course.published,
      isPublished: course.isPublished ?? course.is_published,
      status: course.status,
      locked: course.locked ?? course.isLocked ?? course.is_locked,
      lockReason: course.lockReason ?? course.lock_reason ?? course.lockedReason ?? course.locked_reason
        ?? course.unavailableReason ?? course.unavailable_reason ?? course.prerequisiteReason ?? course.prerequisite_reason,
    };
  });
}

/** Preserve legitimate distinct roles/sections, but do not render duplicate mapping IDs as valid cards. */
export function normalizedFacultyCourses(assignments) {
  const seenMappingIds = new Set();
  return assignments.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { mappingId: `invalid-${index}`, invalidRecord: true,
        name: `Invalid teaching assignment ${index + 1}`, image: FALLBACK_IMAGE };
    }
    const mappingId = Number(item.id);
    if (!Number.isSafeInteger(mappingId) || mappingId <= 0 || seenMappingIds.has(mappingId)) {
      return { mappingId: `invalid-${index}`, invalidRecord: true,
        name: `Duplicate or invalid teaching assignment ${index + 1}`, image: FALLBACK_IMAGE };
    }
    seenMappingIds.add(mappingId);
    // An orphaned course or class must be diagnosed, never become a clickable broken course workspace.
    const hasCourse = !!(item.course_name && String(item.course_name).trim());
    const classId = Number(item.class_id);
    const hasClass = Number.isSafeInteger(classId) && classId > 0;
    return {
      mappingId,
      clsid: hasClass ? classId : null,
      id: item.course_id ?? null,
      slug: item.course_slug || item.slug || null,
      name: hasCourse ? item.course_name : "Course information unavailable",
      courseCode: item.course_code || "",
      image: item.course_image_url || FALLBACK_IMAGE,
      sectionName: item.class_name || "",
      batchName: item.batch_name || "",
      semesterNumber: item.semester_number,
      academicYear: item.academic_year,
      role: item.role,
      invalidRecord: !hasCourse || !hasClass,
      metadataIncomplete: item.metadata_incomplete === true || !hasCourse || !hasClass,
      hasCourse,
    };
  });
}
