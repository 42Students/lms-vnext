"use client";
import {useEffect} from "react";
export function LearnerCourseDocumentTitle({courseName,tabName}:{courseName:string;tabName:string}){
 useEffect(()=>{document.title=courseName+" · "+tabName;},[courseName,tabName]);
 return null;
}
