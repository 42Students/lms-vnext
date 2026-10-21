import "server-only";
import { z } from "zod";

/** External dev fixture provisioning runs in a single DB transaction before
 * publishing this manifest. This module NEVER creates accounts or objects.
 * It replaces the legacy unaudited seed endpoint with a read-only, gated
 * manifest for pre-provisioned, deterministic sandbox fixtures. */
const id = z.uuid();
const tenant = z.strictObject({
  organization: id,
  college: id,
  department: id,
  program: id,
  batch: id,
  class: id,
  course: id,
  lesson: id,
  facultyMembership: id,
  learnerMembership: id,
  announcement: id,
  notification: id,
  discussion: id,
  placementJob: id,
  interview: id,
  project: id,
});
export const devFixtureManifestSchema = z.strictObject({
  revision: z.literal(1),
  /** Stable fixture key also used by the pre-provisioner for idempotent upserts. */
  fixtureKey: z.string().regex(/^[a-z0-9][a-z0-9-]{3,48}$/),
  collegeA: tenant,
  collegeB: tenant,
  /** A verified, short-lived signed URL or an approved sample-media URL.
   * Provisioning must test playback before handing it to the harness. */
  sampleVideoUrl: z.string().url().refine(value => value.startsWith("https://")),
  sampleYoutubeUrl: z.string().url().refine(value => {
    try { return ["www.youtube.com","youtube.com","youtu.be","www.youtube-nocookie.com"].includes(new URL(value).hostname); }
    catch { return false; }
  }),
  /** Exposes in-app fixture identities, never sends external mail/SMS. */
  outboundDeliverySuppressed: z.literal(true),
}).superRefine((data, ctx) => {
  if (data.collegeA.college === data.collegeB.college ||
      data.collegeA.organization === data.collegeB.organization)
    ctx.addIssue({ code: "custom", message: "Fixture tenants must be independent" });
});
export type DevFixtureManifest = z.infer<typeof devFixtureManifestSchema>;

export function readProvisionedDevFixtureManifest(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.APP_E2E_SEED_MANIFEST_JSON;
  if (!raw || raw.length > 24_000) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }
  const result = devFixtureManifestSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function devFixtureManifestEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" &&
    env.APP_ENV === "development" &&
    env.APP_E2E_SEED_ENABLED === "true" &&
    typeof env.APP_E2E_SEED_SECRET === "string" &&
    env.APP_E2E_SEED_SECRET.length >= 32;
}
