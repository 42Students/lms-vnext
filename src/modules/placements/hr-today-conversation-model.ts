export type HrTodayConversation = {
  id: string;
  jobTitle: string;
  unread: number;
  lastMessageAt: Date | null;
  preview: { senderType: string; text: string } | null;
};
export function hrTodayConversationSignals(
  items: readonly HrTodayConversation[],
  totalThreads: number,
) {
  const unread = items.filter(item => item.unread > 0)
    .slice(0, 3)
    .map(item => ({
      id: item.id, label: item.jobTitle,
      unread: item.unread,
      href: "/hr/conversations/" + item.id,
    }));
  const waiting = items.filter(item =>
    item.lastMessageAt !== null && item.preview?.senderType === "RECRUITER",
  ).slice(0, 3).map(item => ({
    id: item.id, label: item.jobTitle,
    href: "/hr/conversations/" + item.id,
  }));
  return {
    unread, waiting,
    unreadInPage: items.reduce((sum, item) => sum + Math.max(0, item.unread), 0),
    totalThreads,
    limitedToCurrentPage: totalThreads > items.length,
  };
}
