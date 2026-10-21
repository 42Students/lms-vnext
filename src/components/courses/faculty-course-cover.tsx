"use client";
import Image from "next/image";
import {useState} from "react";
/** The old LMS uses a 400×140 cover; a broken upload falls back to the
 * bundled course illustration without a gray overlay over valid images. */
export function FacultyCourseCover({url,title}:{url:string|null;title:string}){
 const [broken,setBroken]=useState(false);
 const remote=url&&!broken&&/^https:\/\//i.test(url);
 return <div className="relative h-[140px] w-full overflow-hidden bg-primary-subtle">
  {remote?<Image src={url??""} fill unoptimized alt={"Cover image for "+title}
   onError={()=>setBroken(true)} className="object-cover"
   sizes="(max-width:767px) 100vw, (max-width:1279px) 50vw, 400px"/>:
   <Image src="/assets/images/common/course.svg" alt="" aria-hidden="true"
    width={100} height={100} className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 object-contain opacity-70"/>}
 </div>;
}
