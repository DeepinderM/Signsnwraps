// Client-safe chat types and the unread rule (shared by the chat panel, lists and dashboards).

export type ChatSide = "staff" | "vendor";
export type ChatMessage = { id: string; text: string; at: number; by: string; side: ChatSide };

/** Unread for a side: the last message came from the other side after this side last read the chat. */
export const hasUnread = (po: { lastMessageAt: number; lastMessageSide: ChatSide | ""; staffReadAt: number; vendorReadAt: number }, side: ChatSide) =>
  !!po.lastMessageAt && po.lastMessageSide !== side && po.lastMessageAt > (side === "staff" ? po.staffReadAt : po.vendorReadAt);
