/** DB10 migrations are registered at drizzle/0195 but deployment replay and
 * synonym reconciliation must be attested independently. Do not infer that
 * a checked-in SQL file has run in the configured PostgreSQL cluster.
 *
 * Stage 1: replay registered DB10 schema and verify all three tables plus
 * indexes/constraints; set DB10_SKILLS_SCHEMA_READY=DB10_REPLAY_VERIFIED.
 * Stage 2: import/preview normalized source skills and curated synonyms using
 * the guarded administrative seed job. Reconcile unmatched source skills.
 * Stage 3: after source/count verification, set
 * DB10_SKILLS_READY=DB10_VERIFIED to enable the catalog's read-side API.
 */
export type SkillCatalogReadiness = {
  schemaReplayVerified: boolean;
  catalogReplayVerified: boolean;
  synonymsSeedVerified: boolean;
  enabled: boolean;
};

export function skillsCatalogReadiness(): SkillCatalogReadiness {
  const schemaReplayVerified = process.env.DB10_SKILLS_SCHEMA_READY === "DB10_REPLAY_VERIFIED";
  const catalogReplayVerified = process.env.DB10_SKILLS_READY === "DB10_VERIFIED";
  const synonymsSeedVerified = process.env.DB10_SKILLS_SYNONYMS_READY === "SEED_VERIFIED";
  return {
    schemaReplayVerified,
    catalogReplayVerified,
    synonymsSeedVerified,
    // Synonyms remain an optional bootstrap independent of canonical skills.
    // Never open the read side before actual schema and catalog replay.
    enabled: schemaReplayVerified && catalogReplayVerified,
  };
}

export function skillsCatalogSchemaReady() {
  return skillsCatalogReadiness().schemaReplayVerified;
}

export function skillsCatalogRuntimeEnabled() {
  return skillsCatalogReadiness().enabled;
}
