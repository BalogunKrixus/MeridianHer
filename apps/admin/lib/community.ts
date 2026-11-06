/** The community app, for "View in community" links. */
export const COMMUNITY_URL = (process.env.NEXT_PUBLIC_COMMUNITY_URL ?? "http://localhost:3000").replace(/\/$/, "")

export const communityPost = (id: string, replyId?: string) => `${COMMUNITY_URL}/p/${id}${replyId ? `#reply-${replyId}` : ""}`
