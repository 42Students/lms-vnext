/** Final learner submissions are immutable; require explicit action-specific confirmation. */
export function learnerAssignmentFinalConfirmation(type:"TEXT"|"LINK"):string {
 return type==="TEXT"
  ? "Submit this written response as your final assignment? You cannot replace it after submission."
  : "Submit this HTTPS link as your final assignment? You cannot replace it after submission.";
}
