"use client";
import Image from "next/image";
import {useState} from "react";
import {learnerCourseCardMediaAfterError} from "@/modules/courses/learner-course-card-media-model";

/** Runtime image failures are presentation-only and never alter Course records. */
export function LearnerCourseCardImage({thumbnailUrl}:{thumbnailUrl:string|null}){
 const [failed,setFailed]=useState(false);
 const media=learnerCourseCardMediaAfterError(thumbnailUrl,failed);
 if(media.source==="FALLBACK")return (
  <Image src={media.src} alt="" aria-hidden="true" width={80} height={80}
   className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 object-contain opacity-75" />
 );
 return <Image src={media.src} alt="" fill unoptimized
  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
  onError={()=>setFailed(true)}
  className="pointer-events-none object-cover" />;
}
