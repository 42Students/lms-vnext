/** The legacy repeating-row editor validates each section independently,
 * including a first row that was left blank during creation. */
export function legacyUntitledTemplateRowError(
 sections:readonly (readonly {title:string}[])[],
):string|null{
 for(const rows of sections){
  const first=rows.findIndex(row=>!row.title.trim());
  if(first>=0)return "Item "+(first+1)+": Title required";
 }
 return null;
}
