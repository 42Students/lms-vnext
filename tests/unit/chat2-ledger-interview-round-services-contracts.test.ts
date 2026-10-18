import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

/** Source-contract layer for DB-backed services. Behavior validation belongs to
 * the pure model suites and tenant-scoped integration tests with a live DB. */
const serviceCases=[
  {
    "path": "src/modules/placements/college-drive-interviews-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/college-interview-action-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/college-interview-directory-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/college-interview-lifecycle-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": true
  },
  {
    "path": "src/modules/placements/college-round-slot-action-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/hr-interview-slot-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/hr-round-editor-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/hr-today-open-slots-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/learner-interview-withdrawal-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": true
  },
  {
    "path": "src/modules/placements/learner-round-confirmation-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": false
  },
  {
    "path": "src/modules/placements/round-service.ts",
    "serverOnly": false,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/round-venue-booking-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/super-admin-booked-interviews-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-bulk-round-result-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-confirmed-round-result-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-interview-readiness-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-interview-reschedule-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/tpo-interview-slot-service.ts",
    "serverOnly": true,
    "transaction": true,
    "cas": true
  },
  {
    "path": "src/modules/placements/tpo-recruiter-slot-review-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-round-apply-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-round-calendar-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": true
  },
  {
    "path": "src/modules/placements/tpo-round-drive-day-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-round-import-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  },
  {
    "path": "src/modules/placements/tpo-round-result-table-service.ts",
    "serverOnly": true,
    "transaction": false,
    "cas": false
  }
] as const;

describe("TPO-drive-workspace-44/40, College/HR round & interview service invariants",()=>{
 for(const item of serviceCases){
  it("service policy: "+item.path+" retains tenant scope and its atomicity guards",()=>{
   const source=readFileSync(item.path,"utf8");
   expect(source).toMatch(/collegeId|requireTpoJobCollege|tenant/);
   expect(source).toMatch(/getDb|db\.|TpoJobTx/);
   if(item.serverOnly)expect(source).toContain('import "server-only"');
   if(item.transaction)expect(source).toContain("transaction(");
   if(item.cas)expect(source).toMatch(/expectedVersion|expectedUpdatedAt|date_trunc/);
   expect(source).not.toMatch(/\bdb\.execute\(.*\bDROP\b/);
  });
 }
});
