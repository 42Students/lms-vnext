export type LeadHealthFact = { id: string; manualStage: string; ownerMembershipId: string | null; recruiterUserId: string | null; unsubscribedAt: string | null };
export type ContactFact = { leadId: string; at: string };
export type FollowupFact = { leadId: string; dueAt: string };

/** Contact only means a recorded CALL/EMAIL/WHATSAPP/MEETING, not a NOTE or delivery claim. */
export function summarizeTpoLeadHealth(
  leads: readonly LeadHealthFact[],
  contacts: readonly ContactFact[],
  followups: readonly FollowupFact[],
  nowIso: string,
) {
  const now = Date.parse(nowIso);
  if (!Number.isFinite(now)) throw new Error("Invalid snapshot time");
  const cutoff = now - 14 * 86_400_000;
  const active = leads.filter((row) => row.manualStage !== "NOT_NOW" &&
    row.recruiterUserId === null && row.unsubscribedAt === null);
  const lastContact = new Map<string, number>();
  for (const item of contacts) {
    const at = Date.parse(item.at);
    if (Number.isFinite(at)) lastContact.set(item.leadId,
      Math.max(lastContact.get(item.leadId) ?? -Infinity, at));
  }
  const outstanding = new Set(followups.map((item) => item.leadId));
  const ids = new Set(active.map((row) => row.id));
  const observed = active.map((row) => lastContact.get(row.id));
  const latest = observed.filter((at): at is number => at !== undefined);
  const contactedLast14Days = latest.filter((at) => at >= cutoff).length;
  return {
    actionableLeads: active.length,
    contactedLast14Days,
    goneQuiet14Days: latest.filter((at) => at < cutoff).length,
    noContactEvidence: active.length - latest.length,
    noNextStep: active.filter((row) => !outstanding.has(row.id)).length,
    unassigned: active.filter((row) => row.ownerMembershipId === null).length,
    dueFollowups: followups.filter((item) =>
      ids.has(item.leadId) && Date.parse(item.dueAt) <= now).length,
    lastContactAt: latest.length ? new Date(Math.max(...latest)).toISOString() : null,
    recentContactRatePercent: active.length
      ? Math.round(100 * contactedLast14Days / active.length) : null,
  };
}
