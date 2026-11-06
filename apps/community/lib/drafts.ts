/** Drafts can hold private health questions: clear them when she signs out or leaves (shared phones). */
export function clearDrafts() {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith("meridianher:draft")) window.localStorage.removeItem(key)
    }
  } catch {
    // Storage blocked: nothing was saved
  }
}
