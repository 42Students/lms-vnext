"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type AssessmentDirectoryCourse = { code: string; name: string };
export type AssessmentDirectorySection = {
  courseCode: string;
  deliveryId: string;
  sectionName: string;
  sectionCode: string;
};

export function CollegeAssessmentCourseSectionFilters({
  courses, sections, initialCourseCode, initialDeliveryId,
}: {
  courses: readonly AssessmentDirectoryCourse[];
  sections: readonly AssessmentDirectorySection[];
  initialCourseCode: string;
  initialDeliveryId: string;
}) {
  const listId = useId();
  const initialCourse=courses.find(course=>course.code===initialCourseCode);
  const [courseInput, setCourseInput] = useState(initialCourse?.name??initialCourseCode);
  const courseCode=courses.find(course=>course.name===courseInput||course.code===courseInput)?.code??courseInput;
  const [deliveryId, setDeliveryId] = useState(initialDeliveryId);
  const sectionOptions = sections.filter(section => section.courseCode === courseCode);
  const selectedDeliveryId = sectionOptions.some(section => section.deliveryId === deliveryId)
    ? deliveryId : "";

  return <>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Course
      <Input type="hidden" name="courseCode" value={courseCode}/>
      <Input type="search" list={listId} aria-label="Search or clear course"
        placeholder="All courses" value={courseInput} maxLength={100}
        onChange={event => { setCourseInput(event.target.value); setDeliveryId(""); }}
        className="min-h-11 w-full md:min-h-9 md:w-[260px]" />
      <datalist id={listId}>
        {courses.map(course => <option key={course.code} value={course.name}
          label={course.code} />)}
      </datalist>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Section
      <Select name="deliveryId" value={selectedDeliveryId}
        disabled={!courseCode || sectionOptions.length === 0}
        onChange={event => setDeliveryId(event.target.value)}
        className="min-h-11 w-full md:min-h-9 md:w-[220px]">
        <option value="">All scopes</option>
        {sectionOptions.map(section => <option key={section.deliveryId}
          value={section.deliveryId}>
          {section.sectionName} ({section.sectionCode})
        </option>)}
      </Select>
    </label>
  </>;
}
