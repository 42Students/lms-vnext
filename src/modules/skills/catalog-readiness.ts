/** DB10 migrations are registered at drizzle/0195 but deployment replay and
 * synonym reconciliation must be attested independently. Do not infer that
 * a checked-in SQL file has run in the configured PostgreSQL cluster.
 *
 * Stage 1: replay registered DB10 schema and verify all three tables plus
 * indexes/constraints; set DB10_SKILLS_SCHEMA_READY=DB10_REPLAY_VERIFIED.
 * Stage 2: import/preview normalized source skills and curated synonyms using
 * the guarded administrative seed job. Reconcile unmatched source skills.
 * Stage 3: after source/count verification, set
 * DB10_SKILLS_READY=DB10_VERIFIED, DB10_SKILLS_SYNONYMS_READY=SEED_VERIFIED,
 * and DB10_SKILLS_SOURCE_RECONCILED=LEGACY_RTF_RECONCILED to enable reads.
 * Do not set flags merely because migrations appear in the repository.
 */
export type SkillCatalogReadiness = {
  schemaReplayVerified: boolean;
  catalogReplayVerified: boolean;
  synonymsSeedVerified: boolean;
  sourceReconciled: boolean;
  enabled: boolean;
};

export function skillsCatalogReadiness(): SkillCatalogReadiness {
  const schemaReplayVerified = process.env.DB10_SKILLS_SCHEMA_READY === "DB10_REPLAY_VERIFIED";
  const catalogReplayVerified = process.env.DB10_SKILLS_READY === "DB10_VERIFIED";
  const synonymsSeedVerified = process.env.DB10_SKILLS_SYNONYMS_READY === "SEED_VERIFIED";
  const sourceReconciled = process.env.DB10_SKILLS_SOURCE_RECONCILED === "LEGACY_RTF_RECONCILED";
  return {
    schemaReplayVerified,
    catalogReplayVerified,
    synonymsSeedVerified,
    sourceReconciled,
    // Search parity needs verified source coverage and synonyms, not just an
    // empty schema or a manual "ready" switch after partial import.
    enabled: schemaReplayVerified && catalogReplayVerified &&
      synonymsSeedVerified && sourceReconciled,
  };
}

export function skillsCatalogSchemaReady() {
  return skillsCatalogReadiness().schemaReplayVerified;
}

export function skillsCatalogRuntimeEnabled() {
  return skillsCatalogReadiness().enabled;
}
