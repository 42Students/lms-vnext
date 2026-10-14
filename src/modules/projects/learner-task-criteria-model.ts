/** Nonempty authored task criteria are displayed as plain React text. */
export function learnerTaskCriteriaPreview(value:string|null):string|null {
  const text=value?.trim()??"";
  return text ? text : null;
}
