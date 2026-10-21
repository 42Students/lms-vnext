import { useState, useEffect, useRef } from "react";
import { getProgram, getFacultyProgram } from "@/api/Services/courseServices";
import { useSelector } from "react-redux";
import { ensureArray } from "@/utils/learnerApiUtils";

function safeCourseDate(createdAt) {
  if (!Array.isArray(createdAt) || createdAt.length < 3) return "—";
  return `${createdAt[2] ?? ""}/${createdAt[1] ?? ""}/${createdAt[0] ?? ""}`;
}

/** Safely parse a date, returning null instead of Invalid Date or misleading "now" fallback. */
function safeParseDateOrNull(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

const useCourses = () => {
  const [modifiedCourses, setModifiedCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
  const loginUser = useSelector((state) => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const userId = loginUser?.id;
  const programId = loginUser?.programId ?? loginUser?.program_id;
  const classId = loginUser?.classId;
  const abortRef = useRef(null);

  useEffect(() => {
    if (!loginUser?.isUserLoggedIn || !userId) {
      setModifiedCourses([]);
      setCoursesLoading(false);
      setCoursesError(null);
      return;
    }

    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const isAborted = () => signal.aborted;

    setCoursesLoading(true);
    setCoursesError(null);

    if (isTeacherRole) {
      getFacultyProgram({ facultyId: userId })
        .then((res) => {
          if (isAborted()) return;
          const assignments = ensureArray(res?.data?.data);
          // getFacultyProgram (getActiveAssignmentsByFaculty) returns a flat
          // {courseId, courseName, classId, ...} row per teaching assignment, never the nested
          // `item.course` shape this used to filter/map on -- so `.filter((item) => item.course)`
          // dropped every row and this hook has always handed the calendar an empty course list
          // for faculty. One course can also have several class assignments, so dedupe by id.
          const byId = new Map();
          assignments.forEach((item) => {
            const id = item?.courseId ?? item?.course_id;
            if (id == null || byId.has(id)) return;
            const name = item?.courseName ?? "—";
            byId.set(id, {
              clsid: item?.classId ?? item?.class_id,
              id,
              name,
              date: "—",
              type: "course",
              title: name,
              allDay: false,
            });
          });
          setModifiedCourses(Array.from(byId.values()));
        })
        .catch((err) => {
          if (isAborted()) return;
          setModifiedCourses([]);
          setCoursesError("Failed to load courses. Please try again.");
        })
        .finally(() => {
          if (!isAborted()) setCoursesLoading(false);
        });
      return () => { abortRef.current?.abort(); };
    }

    if (!programId) {
      setModifiedCourses([]);
      setCoursesLoading(false);
      return;
    }

    getProgram({ programId })
      .then((res) => {
        if (isAborted()) return;
        const structure = res?.data?.data?.program_structure;
        // Use all program structures, not just the first
        const allStructures = Array.isArray(structure) ? structure : [];
        const allCourses = allStructures.flatMap((s) => ensureArray(s?.courses));
        const tempCourses = allCourses
          .filter((course) => course && typeof course === "object")
          .map((course) => {
            const meta = course.meta_data || course.metaData || {};
            const createdAt = course.created_at || course.createdAt || [];
            return {
              clsid: classId,
              id: course.id,
              name: course.course_name ?? course.name ?? "—",
              image: meta.image_url ?? meta.imageUrl,
              htmlContent: meta.html_content ?? meta.htmlContent,
              date: safeCourseDate(createdAt),
            };
          });
        setModifiedCourses(tempCourses);
      })
      .catch((err) => {
        if (isAborted()) return;
        setModifiedCourses([]);
        setCoursesError("Failed to load courses. Please try again.");
      })
      .finally(() => {
        if (!isAborted()) setCoursesLoading(false);
      });

    return () => { abortRef.current?.abort(); };
  }, [userId, programId, classId, isTeacherRole, loginUser?.isUserLoggedIn]);

  return [modifiedCourses, setModifiedCourses, coursesLoading, coursesError];
};

export default useCourses;
