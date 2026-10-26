/** Faculty attendance mutation reconciliation. A conflict or failed
 * transport can conceal an already committed write, so require a fresh
 * authorized session/roster read before allowing another submission.
 */
export function facultyAttendanceWriteNeedsReload(status:number|null):boolean{
 return status===null||status===408||status===409||status===412||status>=500;
}
