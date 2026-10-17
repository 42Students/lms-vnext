import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";

/** Source smoke tests supplement each gap's earlier behavioral chat12-* tests,
 * recorded in the page acceptance files. Source presence is not runtime acceptance. */
const cases:readonly (readonly [string,string,string])[] = [
  [
    "TPO-students-16",
    "src/components/tpo/tpo-bulk-action-panel.tsx",
    "Retry"
  ],
  [
    "TPO-students-17",
    "src/components/tpo/tpo-students-selection.tsx",
    "sessionStorage"
  ],
  [
    "TPO-students-22",
    "src/modules/placements/tpo-students-service.ts",
    "skillName"
  ],
  [
    "TPO-students-28",
    "src/modules/placements/tpo-students-model.ts",
    "bestSoFar"
  ],
  [
    "TPO-students-32",
    "src/app/(authenticated)/tpo/students/page.tsx",
    "Registration is not open"
  ],
  [
    "TPO-students-24",
    "src/modules/placements/tpo-students-filter-aliases.ts",
    "f_profile"
  ],
  [
    "TPO-students-25",
    "src/app/(authenticated)/tpo/students/page.tsx",
    "first(raw.q)"
  ],
  [
    "TPO-students-43",
    "src/components/tpo/tpo-student-quick-panel.tsx",
    "Placement eligibility"
  ],
  [
    "TPO-students-46",
    "src/app/(authenticated)/tpo/students/page.tsx",
    "Everyone in placements, from the batches you made eligible."
  ],
  [
    "TPO-students-47",
    "src/app/(authenticated)/tpo/students/page.tsx",
    "Nobody is in placements yet."
  ],
  [
    "TPO-students-R04",
    "src/components/tpo/tpo-students-spreadsheet.tsx",
    "urlKey:\"programId\""
  ],
  [
    "TPO-students-R05",
    "src/app/(authenticated)/tpo/students/page.tsx",
    "PageHeader"
  ],
  [
    "TPO-students-R06",
    "src/modules/placements/tpo-student-display-label.ts",
    "tpoStudentDisplayLabel"
  ],
  [
    "TPO-students-R07",
    "src/modules/placements/tpo-students-service.ts",
    "scopedRows"
  ],
  [
    "TPO-students-48",
    "src/components/tpo/tpo-students-selection.tsx",
    "selected of"
  ],
  [
    "TPO-students-53",
    "src/modules/placements/tpo-students-model.ts",
    "\"ISSUED\""
  ],
  [
    "TPO-students-36",
    "src/app/api/placements/tpo/students/export-xlsx/route.ts",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ],
  [
    "TPO-students-39",
    "src/components/tpo/tpo-grid-column-chooser.tsx",
    "Reset columns"
  ],
  [
    "TPO-students-51",
    "src/components/tpo/tpo-spreadsheet-grid.tsx",
    "md:hidden"
  ],
  [
    "TPO-students-13",
    "src/components/tpo/tpo-bulk-action-panel.tsx",
    "INELIGIBLE"
  ],
  [
    "TPO-requests-verification-23",
    "src/modules/placements/tpo-verification-queue-service.ts",
    "counts"
  ],
  [
    "TPO-requests-verification-17",
    "src/app/(authenticated)/tpo/requests/page.tsx",
    "What students have asked you to decide:"
  ],
  [
    "TPO-requests-verification-27",
    "src/modules/verification/review-reasons.ts",
    "The marksheet is unclear or cropped"
  ],
  [
    "TPO-requests-verification-28",
    "src/components/verification/TpoVerificationPanel.tsx",
    "Sent back. The student sees your reason."
  ],
  [
    "TPO-requests-verification-29",
    "src/components/verification/VerificationReviewDrawer.tsx",
    "History"
  ],
  [
    "TPO-requests-verification-R01",
    "src/modules/placements/request-service.ts",
    "DECLINED"
  ],
  [
    "TPO-requests-verification-16",
    "src/app/(authenticated)/tpo/requests/page.tsx",
    "TpoRequestPageClipboard"
  ]
];
describe("chat-5 queue source revalidation of previously authored functionality",()=>{
 for(const [id,path,needle] of cases){
  it(id+" keeps the checked feature wired at the audited boundary",()=>{
   const source=readFileSync(new URL("../../"+path,import.meta.url),"utf8");
   expect(source).toContain(needle);
  });
 }
});
