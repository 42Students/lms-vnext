export function projectTpoCompanyRelationshipSummary(input: {
  status: string;
  isTrusted: boolean;
  updatedAt: string;
} | null) {
  if (!input) return null;
  const timestamp = Date.parse(input.updatedAt);
  return {
    relationshipStatus: input.status,
    trustLabel: input.isTrusted ? "Trusted" : "Not verified",
    isTrusted: input.isTrusted,
    updatedAt: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
  };
}
