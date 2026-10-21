"use client";

import {FacultyAssignmentsFailure} from "@/components/courses/faculty-assignments-retention";

export default function FacultyAssignmentsOverviewError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <FacultyAssignmentsFailure reset={reset}/>;
}
