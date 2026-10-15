/** Remount image-only failure state on a new persisted Course thumbnail. */
export function learnerCourseImageResetKey(deliveryId:string,thumbnailUrl:string|null):string{
 return JSON.stringify([deliveryId,thumbnailUrl]);
}
