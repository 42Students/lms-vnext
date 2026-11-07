import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL("../"+path,import.meta.url), "utf8");

test("selection imports ignore superseded file reads", () => {
 const ui=source("src/components/placements/tpo-selection-import.tsx");
 assert.match(ui,/const revision=\+\+fileRevision\.current/);
 assert.match(ui,/if\(revision!==fileRevision\.current\)return/);
 assert.match(ui,/if\(revision===fileRevision\.current\)setReading\(false\)/);
});

test("partially recorded selections cannot be submitted a second time before reconciliation", () => {
 const ui=source("src/components/placements/tpo-selection-import.tsx");
 assert.match(ui,/setNeedsRefresh\(true\)/);
 assert.match(ui,/if\(busy\|\|reading\|\|needsRefresh\|\|importRef\.current/);
 assert.match(ui,/disabled=\{busy\|\|reading\|\|needsRefresh\}/);
 assert.match(ui,/Reload selection register/);
 assert.match(ui,/row\(s\) confirmed before the error/);
});

test("waitlist promotion locks repeat issuance after success or ambiguous network failure", () => {
 const ui=source("src/components/placements/tpo-waitlist-promotion-control.tsx");
 assert.equal((ui.match(/setRequiresRefresh\(true\)/g)||[]).length,2);
 assert.match(ui,/!preview\.storageReady\|\|requiresRefresh\|\|inFlight\.current/);
 assert.match(ui,/disabled=\{busy\|\|requiresRefresh\|\|reason\.trim\(\)\.length<3\}/);
 assert.match(ui,/requiresRefresh\?window\.location\.reload\(\):router\.refresh\(\)/);
 assert.match(ui,/expectedPreviewToken:preview\.previewToken/);
});

test("calendar request revision prevents old recruiter replies replacing a newer selection", () => {
 const ui=source("src/components/placements/tpo-week-hour-calendar.tsx");
 assert.match(ui,/const revision=\+\+leadRequestRevision\.current/);
 assert.match(ui,/revision===leadRequestRevision\.current\)setLeads/);
 assert.match(ui,/revision===leadRequestRevision\.current\)setLoadingLeads\(false\)/);
 assert.match(ui,/leadRequestRevision\.current\+\+/);
 assert.match(ui,/keyboard, or drag it to another hour/);
});
