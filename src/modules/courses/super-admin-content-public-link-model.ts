import {safeLearnerResourceMaterialHref} from "./lesson-resource-materials-model";

/**
 * SA-academics-people-62: imported catalogue URLs predate current validation.
 * Shared material policy denies credentials, fragments and private/loopback
 * networks before a browser renders public lesson content previews.
 */
export function safePublicCourseContentUrl(value:string|null|undefined):string|null{
 const safe=safeLearnerResourceMaterialHref(value);
 return safe?new URL(safe).toString():null;
}
