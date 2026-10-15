/** When a degree becomes current, its completion year is no longer valid.
 * Preserve all other fields, including existing private receipt references. */
export function facultyEducationFieldEdit<T extends { id: string }>(
 row: T, name: keyof T & string, value: string | boolean,
): Record<string, string | boolean> {
 if (name === "isCurrentlyPursuing" && value === true) {
  return {isCurrentlyPursuing:true,endYear:""};
 }
 return {[name]:value};
}
