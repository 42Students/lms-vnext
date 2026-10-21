import Api from "../ApiMethod";

// Dedicated assignment authoring route; generic lesson-content writer excludes ASSIGNMENT.
export const saveAdminAssignmentContent = (payload) =>
  Api.post("/api/v1/admin/assignments/content/save", payload);
