import type {ReactNode} from "react";
import {getCurrentRequestContext} from "@/auth/request-context";
import {CollegeLessonsMemory} from "@/components/courses/college-lessons-last-good";

export default async function CollegeLessonsLayout({children}:{children:ReactNode}){
 const ctx=await getCurrentRequestContext();
 // A role/college switch unmounts the previous private lesson-list snapshot.
 const scope=[ctx.user.id,ctx.membership?.id??"NO_COLLEGE"].join(":");
 return <CollegeLessonsMemory key={scope}>{children}</CollegeLessonsMemory>;
}
