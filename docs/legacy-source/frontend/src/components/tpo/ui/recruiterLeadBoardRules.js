// Recruiter leads board: what dropping a recruiter lead on a column means. Some stages are set by hand, some are facts the system works out,
// and a fact cannot be dragged into. Dropping on a fact stage starts the action that makes it true (send the invite, plan the drive).

/** What a drop does. `null` means that column cannot be dropped on. */
export function dropAction(fromStage, toStage) {
  if (!toStage || fromStage === toStage) return null;
  switch (toStage) {
    case "CONTACTED": return fromStage === "NEW" || fromStage === "NOT_NOW" || fromStage === "INVITED" ? "MARK_CONTACTED" : null;
    case "NOT_NOW": return fromStage === "RECRUITED" ? null : "NOT_NOW";
    case "INVITED": return fromStage === "NEW" || fromStage === "CONTACTED" || fromStage === "NOT_NOW" ? "INVITE" : null;
    case "DRIVE_PLANNED": return fromStage === "JOINED" || fromStage === "INVITED" || fromStage === "CONTACTED" ? "CREATE_DRIVE" : null;
    default: return null; // NEW, JOINED and RECRUITED are never set by dragging
  }
}

/** Why a column cannot be dropped on, for the hint shown while dragging. */
export function lockedReason(stage) {
  switch (stage) {
    case "NEW": return "Every recruiter lead starts here.";
    case "JOINED": return "Automatic: the recruiter accepts your invite.";
    case "RECRUITED": return "Automatic: a student accepts an offer from this company.";
    default: return null;
  }
}

/** What dropping will do, in words, for the hint on a droppable column. */
export function dropHint(action) {
  switch (action) {
    case "MARK_CONTACTED": return "Drop to mark contacted";
    case "NOT_NOW": return "Drop to say not now, and why";
    case "INVITE": return "Drop to send an invite";
    case "CREATE_DRIVE": return "Drop to plan a drive";
    default: return "";
  }
}
