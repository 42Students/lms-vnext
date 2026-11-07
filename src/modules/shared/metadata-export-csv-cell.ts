/** Spreadsheet apps may skip leading Unicode formatting/combining marks while
 * deciding whether a quoted field is a formula. Preserve visible copy, prefix
 * apostrophe if the first significant character is =, +, @, or -.
 * Metadata exports keep fields on one physical row to prevent forged records.
 */
export function safeMetadataCsvCell(value: string | number): string {
  const flattened=String(value).replace(/[\r\n\t\u0085\u2028\u2029]/g," ");
  const safe=/^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*[=+@-]/u.test(flattened)
    ? "'"+flattened : flattened;
  return '"'+safe.replaceAll('"','""')+'"';
}
