import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(
  path.resolve(process.cwd(), "src/db/schema/tpo-collaboration.ts"),
  "utf8",
);

test("DB09 collaboration schema uses final recruiter-era stored codes", () => {
  assert.match(
    schema,
    /senderType} in \('TPO', 'RECRUITER'\)/,
    "tpo_message sender_type must use final V193 RECRUITER code",
  );
  assert.doesNotMatch(
    schema,
    /senderType} in \('TPO', 'HR'\)/,
    "legacy HR sender code must not remain in the DB contract",
  );
  assert.match(schema, /'RECRUITER_LEADS'/);
  assert.doesNotMatch(
    schema,
    /scope} in \('STUDENTS','LEADS','DRIVES'\)/,
    "pre-V193 LEADS-only saved-view check must not return",
  );
});

test("DB09 share-event DB vocabulary covers live delivery events", () => {
  for (const action of [
    "CREATED",
    "OPENED",
    "DOWNLOADED_LIST",
    "DOWNLOADED_ZIP",
    "REVOKED",
    "LINK_EMAILED",
    "CODE_EMAILED",
  ]) {
    assert.match(schema, new RegExp("'" + action + "'"));
  }
});

test("DB09 college settings persist recruiter access policy", () => {
  assert.match(schema, /recruiterAccessMonths: integer\("recruiter_access_months"\)/);
  assert.match(
    schema,
    /recruiterDriveNeedsApproval: boolean\("recruiter_drive_needs_approval"\)/,
  );
  assert.match(
    schema,
    /recruiterAccessMonths} between 0 and 60/,
    "access duration must preserve the live 0=no-expiry, max-60-month contract",
  );
});
