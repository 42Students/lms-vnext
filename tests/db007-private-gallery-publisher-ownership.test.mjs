import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gallery = readFileSync(
  new URL("../src/modules/profile-verification/learner-image-gallery-service.ts", import.meta.url),
  "utf8",
);
const own = gallery.slice(gallery.indexOf("async function requireOwnGalleryUpload("),
  gallery.indexOf("export async function initiateOwnLearnerGalleryUpload("));
const append = gallery.slice(gallery.indexOf("export async function appendLearnerGalleryImage("),
  gallery.indexOf("export async function deactivateLearnerGalleryImage("));
const deactivate = gallery.slice(gallery.indexOf("export async function deactivateLearnerGalleryImage("),
  gallery.indexOf("export async function openLearnerGalleryImage("));

test("DB-007 private gallery publishing requires current learner ownership", () => {
  assert.match(own, /hasMembershipRole\(context, "LEARNER"\)/);
  assert.match(own, /context\.user\.platformStatus !== "ACTIVE"/);
  assert.match(own, /context\.membership\.status !== "ACTIVE"/);
  assert.match(own, /access\.membershipId !== context\.membership\.id/);
  assert.match(append, /const access = await requireOwnGalleryUpload\(context\)/);
  assert.match(append, /uuid\.parse\(membershipId\) !== access\.membershipId/);
  assert.doesNotMatch(append, /const access = await galleryAccess\(context, membershipId\)/);
});

test("DB-007 admin cleanup remains scoped and live-authorized without publishing", () => {
  assert.match(deactivate, /const access = await galleryAccess\(context, membershipId\)/);
  assert.match(deactivate, /await recheckGalleryWriteActor\(tx, context, access\)/);
  assert.match(deactivate, /eq\(learnerProfileImages\.learnerMembershipId, access\.membershipId\)/);
  assert.match(append, /eq\(profilePrivateDocumentReceipts\.owningMembershipId, access\.membershipId\)/);
  assert.match(append, /await recheckGalleryWriteActor\(tx, context, access\)/);
});
