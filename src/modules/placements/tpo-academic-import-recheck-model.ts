import type {PlacementEligibilityResult} from "./eligibility-service";
/** A re-import only triggers a notice when the evidence newly disqualifies the student. */
export function tpoAcademicImportNewlyIneligible(
 before:PlacementEligibilityResult["status"],
 after:PlacementEligibilityResult["status"],
):boolean{
 return before!=="INELIGIBLE"&&after==="INELIGIBLE";
}
