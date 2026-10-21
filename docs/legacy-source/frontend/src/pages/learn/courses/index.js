import React from "react";
import CoursesContent from "@/components/Course/CoursesContent";

export default function LearnCoursesPage() {
  return <CoursesContent basePath="/learn" showHeader={true} isTeacher={false} />;
}
