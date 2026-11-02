/**
 * UI-03 P03 — Source Parity Test: Learner/Faculty Profiles
 *
 * Checks:
 *  1. Every MATCHED surface in ui-inventory-ui03.json has its vNextPath on disk.
 *  2. Every string value in ui-strings-ui03.json is either found in vNext component
 *     files (PASS) or flagged as a warning (P04 visual parity catches actual render diffs).
 *
 * Run: node --test tests/ui03-source-parity.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const inventory = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/planning/ui-inventory-ui03.json'), 'utf8')
);
const stringsDoc = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/planning/ui-strings-ui03.json'), 'utf8')
);

const matchedSurfaces = inventory.surfaces.filter(s => s.disposition === 'MATCHED');
const stringEntries = Object.entries(stringsDoc.strings);

// ──────────────────────────────────────────────
// Suite 1: Surface files exist on disk
// ──────────────────────────────────────────────
describe('UI-03 Source Parity — Learner/Faculty Profiles', () => {
  describe('Surface files exist on disk', () => {
    for (const surface of matchedSurfaces) {
      test(`${surface.id}: ${surface.vNextPath}`, () => {
        const fullPath = path.join(ROOT, surface.vNextPath);
        assert.ok(
          fs.existsSync(fullPath),
          `MISSING: ${surface.vNextPath} not found on disk`
        );
      });
    }
  });

  // ──────────────────────────────────────────────
  // Suite 2: String values present in vNext components (warnings only at P03)
  // ──────────────────────────────────────────────
  describe('String values present in vNext components (warnings logged; not failures)', () => {
    // Build a lookup: domain prefix → list of search directories from matched surfaces
    const domainDirs = new Map();
    for (const surface of matchedSurfaces) {
      const dirPath = path.join(ROOT, path.dirname(surface.vNextPath));
      // Index by the first path segment after (authenticated)/  e.g. "learn", "teacher", etc.
      const parts = surface.vNextPath.split('/');
      const authIdx = parts.indexOf('(authenticated)');
      const domainKey = authIdx >= 0 ? parts[authIdx + 1] : 'unknown';
      if (!domainDirs.has(domainKey)) domainDirs.set(domainKey, new Set());
      domainDirs.get(domainKey).add(dirPath);
    }

    // Fallback search root when no domain mapping can be determined
    const fallbackDir = path.join(ROOT, 'src/app/(authenticated)');

    for (const [key, value] of stringEntries) {
      if (!value || value.length < 3) continue; // skip trivially short strings

      test(`string: ${key}`, () => {
        // Map the key's first segment (profile/students/people/faculty/…) to domain dirs
        const keyPrefix = key.split('.')[0]; // e.g. "profile", "students", "people", "faculty"

        // Collect candidate search directories
        const candidateDirs = new Set();
        for (const [domainKey, dirs] of domainDirs.entries()) {
          if (
            domainKey.includes(keyPrefix) ||
            keyPrefix.includes(domainKey) ||
            // cross-mapping: "profile" lives in learn/teacher/college/hr/mentor/tpo
            (keyPrefix === 'profile') ||
            (keyPrefix === 'people' && domainKey === 'admin') ||
            (keyPrefix === 'students' && (domainKey === 'admin' || domainKey === 'college')) ||
            (keyPrefix === 'faculty' && domainKey === 'college') ||
            (keyPrefix === 'facultyAssignment' && domainKey === 'admin')
          ) {
            for (const d of dirs) candidateDirs.add(d);
          }
        }
        if (candidateDirs.size === 0) candidateDirs.add(fallbackDir);

        let found = false;
        for (const searchDir of candidateDirs) {
          if (!fs.existsSync(searchDir)) continue;
          let entries;
          try {
            entries = fs.readdirSync(searchDir);
          } catch {
            continue;
          }
          const tsxFiles = entries.filter(f => /\.(tsx?|jsx?)$/.test(f));
          for (const file of tsxFiles) {
            const content = fs.readFileSync(path.join(searchDir, file), 'utf8');
            if (content.includes(value)) {
              found = true;
              break;
            }
          }
          if (found) break;
        }

        // P03: log warnings for unfound strings; P04 (visual) will catch actual render gaps
        if (!found) {
          console.log(`  WARN [${key}]: "${value}" not yet found in vNext components`);
        }
        // Not a hard failure at P03 — intentional
      });
    }
  });
});
