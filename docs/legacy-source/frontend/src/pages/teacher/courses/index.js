import React from "react";
import CoursesContent from "@/components/Course/CoursesContent";

export default function TeacherCoursesPage() {
  return <CoursesContent basePath="/teacher" showHeader={true} isTeacher={true} />;
}
