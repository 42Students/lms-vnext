import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, Skeleton, Tag } from "antd";
import { getAllActiveTeachingAssignments } from "@/api/Services/FacultyAssignmentService";

const ROLE = { PRIMARY: "Primary", CO_TEACHER: "Co-teacher", TA: "Teaching assistant" };

/**
 * Who teaches this course, for which section and semester. The admin course page only showed the
 * description students read, so "is anyone teaching Java to CSE - A?" meant leaving the page.
 */
export default function CourseTeachersPanel({ courseId }) {
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!courseId) return undefined;
    let cancelled = false;
    setRows(null); setFailed(false);
    getAllActiveTeachingAssignments()
      .then((res) => {
        if (cancelled) return;
        const all = res?.data?.data ?? res?.data ?? [];
        setRows((Array.isArray(all) ? all : []).filter((a) => Number(a.course_id ?? a.courseId) === Number(courseId)));
      })
      .catch(() => { if (!cancelled) { setRows([]); setFailed(true); } });
    return () => { cancelled = true; };
  }, [courseId]);

  return (
    <section className="mt-4" aria-label="Who teaches this course">
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Who teaches it</h3>
      {rows == null ? <Skeleton active paragraph={{ rows: 2 }} title={false} />
        : failed ? <div style={{ color: "#8c8c8c" }}>Couldn&apos;t load teachers. Refresh to try again.</div>
        : rows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>No teacher is assigned yet. <Link href="/college-admin/faculty-assignment">Assign faculty</Link></span>} />
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((a) => (
              <li key={a.id} style={{ padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                <strong>{a.class_name ?? a.className ?? "All sections"}</strong>
                {(a.semester_number ?? a.semesterNumber) ? ` · Semester ${a.semester_number ?? a.semesterNumber}` : ""}
                {" — "}{a.faculty_name ?? a.facultyName ?? "Unknown teacher"}
                <Tag style={{ marginLeft: 8 }}>{ROLE[a.role] || "Primary"}</Tag>
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}
