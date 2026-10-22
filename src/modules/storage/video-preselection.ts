import {
 MAX_VIDEO_BYTES,
 acceptAttributeFor,
 guessContentTypeFromName,
 validateStorageDeclaration,
} from "./file-policy";

/** Only single-PUT uploads are implemented; the old 5 GiB UI promise was
 * inaccurate for vNext. Run this check BEFORE requesting a signed grant.
 * Server policy independently validates again. */
export const LESSON_VIDEO_SINGLE_PUT_LIMIT_TEXT =
 "Maximum video size: 4900 MiB (not 5 GiB). Larger videos need multipart upload, which is not available.";
export const LESSON_VIDEO_ACCEPT = acceptAttributeFor("lesson-video");

export function lessonVideoPreselection(input:{
 name:string;type:string;size:number;
}):{ok:true;maxBytes:number}|{ok:false;message:string}{
 if(input.size>MAX_VIDEO_BYTES)
  return {ok:false,message:LESSON_VIDEO_SINGLE_PUT_LIMIT_TEXT};
 const checked=validateStorageDeclaration("lesson-video",{
  originalName:input.name,
  contentType:input.type || guessContentTypeFromName("lesson-video",input.name) || "",
  sizeBytes:input.size,
 });
 if(!checked.ok){
  const messages={
   STORAGE_NAME_INVALID:"Rename the video to a valid file name and try again.",
   STORAGE_TYPE_NOT_ALLOWED:"Choose an MP4, WebM, MOV, AVI, or M4V video.",
   STORAGE_EXTENSION_MISMATCH:"The video extension does not match its file type.",
   STORAGE_SIZE_INVALID:input.size===0
    ?"The video file is empty. Choose a nonempty video."
    :"Choose a video with a valid file size.",
   STORAGE_FILE_TOO_LARGE:LESSON_VIDEO_SINGLE_PUT_LIMIT_TEXT,
  } as const;
  return {ok:false,message:messages[checked.code]};
 }
 return {ok:true,maxBytes:MAX_VIDEO_BYTES};
}
