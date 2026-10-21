import "server-only";

import { getDb } from "@/db/client";
import { db10Skills } from "@/db/schema/db10-skills-catalog.draft";

export type LegacySkillSeedRow = {
  name: string;
  displayName: string;
  category: string | null;
};

/** Deterministic CSV parser for the legacy name,display_name,category
 * source. Unlike the retired split(",",3), quoted commas and newlines do
 * not corrupt a displayed skill name. No network fetch or filesystem access
 * is performed by this module: a migration owner supplies source bytes.
 */
export function parseLegacySkillCsv(input: string): LegacySkillSeedRow[] {
  if (input.length > 20_000_000) throw new Error("SKILL_SEED_TOO_LARGE");
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  const source = input.replace(/^\uFEFF/, "");
  for (let i=0;i<source.length;i++) {
    const char=source[i]!;
    if (char === '"') {
      if (quoted && source[i+1] === '"') {value+='"';i++;}
      else quoted=!quoted;
    } else if (char === "," && !quoted) {
      row.push(value);value="";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char==="\r" && source[i+1]==="\n") i++;
      row.push(value);if (row.some(item=>item.trim())) rows.push(row);
      row=[];value="";
    } else {value+=char;}
  }
  if (quoted) throw new Error("SKILL_SEED_UNCLOSED_CSV_QUOTE");
  row.push(value);if(row.some(item=>item.trim()))rows.push(row);
  const header=rows.shift()?.map(value=>value.trim().toLowerCase()) ?? [];
  if (header.join(",") !== "name,display_name,category")
    throw new Error("SKILL_SEED_EXPECTED_LEGACY_HEADER");
  const unique=new Map<string,LegacySkillSeedRow>();
  for (const [index,cells] of rows.entries()) {
    if (cells.length !== 3) throw new Error("SKILL_SEED_INVALID_ROW_"+(index+2));
    const name=cells[0]!.trim().toLocaleLowerCase("en-US");
    const displayName=cells[1]!.trim();
    const category=cells[2]!.trim()||null;
    if (!name || !displayName || name.length>200 || displayName.length>200 ||
      (category && category.length>50)) throw new Error("SKILL_SEED_INVALID_ROW_"+(index+2));
    if (!unique.has(name)) unique.set(name,{name,displayName,category});
    else if (unique.get(name)!.displayName!==displayName)
      throw new Error("SKILL_SEED_DUPLICATE_CONFLICT_"+(index+2));
  }
  return [...unique.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName));
}

/** Historical RTF fallback. Original CSV is authoritative because only CSV
 * preserves display and category values. If it is missing, retain each RTF
 * skill name and leave category null instead of inventing classification. */
export function parseLegacySkillRtf(input:string): LegacySkillSeedRow[] {
  if (input.length>20_000_000) throw new Error("SKILL_SEED_TOO_LARGE");
  const names=new Map<string,LegacySkillSeedRow>();
  for (const raw of input.split(/\r?\n/)) {
    if (!raw.trim() || /^(\{\\rtf|\\f\d|\\cf\d|\\pard|\\fonttbl|\\colortbl)/.test(raw.trim()))continue;
    const cleaned=raw.replace(/\\[a-z]+\d*\s?/gi,"").replace(/[{}]/g,"")
      .replace(/\\$/,"").trim();
    if (!cleaned || cleaned.length>200)continue;
    let decoded:string;
    try {decoded=decodeURIComponent(cleaned.replace(/\+/g,"%20"));}catch{continue;}
    const name=decoded.trim().toLocaleLowerCase("en-US");
    if (!name || name.length>200 || /^\d+$/.test(name) || name.startsWith("linkedin"))continue;
    if(!names.has(name))names.set(name,{name,displayName:decoded.trim(),category:null});
  }
  return [...names.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName));
}

/** Run once after the DB10 migration and reviewed source checksum.
 * Dry-run is mandatory by default. Re-running is harmless (no deletes,
 * no counter resets and no overwriting human-edited display names).
 * Mutation does NOT run from a HTTP request or at application startup. */
export async function applyLegacySkillSeed(
  rows: readonly LegacySkillSeedRow[],
  options: {dryRun?:boolean; expectedCount?:number}={},
) {
  if (!rows.length || rows.length>100_000)throw new Error("SKILL_SEED_INVALID_COUNT");
  if(options.expectedCount!==undefined && rows.length!==options.expectedCount)
    throw new Error("SKILL_SEED_COUNT_MISMATCH");
  if(options.dryRun!==false)return {checked:rows.length,inserted:0,dryRun:true};
  const db=getDb();
  let attempted=0;
  await db.transaction(async tx=>{
    for(let offset=0;offset<rows.length;offset+=250){
      const batch=rows.slice(offset,offset+250);
      await tx.insert(db10Skills).values(batch.map(row=>({
        name:row.name,displayName:row.displayName,category:row.category,
      }))).onConflictDoNothing();
      attempted+=batch.length;
    }
  });
  return {checked:rows.length,attempted,dryRun:false};
}
