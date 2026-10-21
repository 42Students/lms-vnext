import {
 MAX_VIDEO_BYTES,
 acceptAttributeFor,
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
  contentType:input.type,
  sizeBytes:input.size,
 });
 if(!checked.ok)return {ok:false,message:
  checked.code==="STORAGE_SIZE_INVALID"?"Choose a video with a valid file size.":
  "Choose an MP4, WebM, MOV, AVI, or M4V video."};
 return {ok:true,maxBytes:MAX_VIDEO_BYTES};
}
