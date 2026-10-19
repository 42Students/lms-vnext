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
   className="pointer-events-none absolute right-2 top-1 h-20 w-20 opacity-20" />
 );
 return <Image src={media.src} alt="" fill unoptimized
  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
  onError={()=>setFailed(true)}
  className="pointer-events-none object-cover opacity-20" />;
}
