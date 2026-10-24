/** Select only authorized employer/college conversations for a refresh.
 * Missing scope means the caller's currently authorized colleges, never all
 * records. Duplicate grants do not inflate the selected set.
 */
export function recruiterConversationPulseColleges(
  authorized:readonly string[], requested?:string,
):string[]|null {
  const unique=[...new Set(authorized)];
  if(requested!==undefined && !unique.includes(requested))return null;
  return requested===undefined?unique:[requested];
}
