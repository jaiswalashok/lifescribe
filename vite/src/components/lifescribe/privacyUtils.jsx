/**
 * Privacy utility functions for cascading privacy levels
 * Ensures higher privacy (more restrictive) always takes precedence
 */

/**
 * Get the effective privacy level between entry and chapter
 * Returns the most restrictive privacy setting
 * @param {string} entryAudience - Entry audience (private, connections, public)
 * @param {string} chapterPrivacy - Chapter privacy (private, circles/connections)
 * @returns {string} Most restrictive privacy setting
 */
export function getEffectivePrivacy(entryAudience, chapterPrivacy) {
  // Privacy hierarchy (most restrictive to least):
  // private > connections > public

  const privacyLevel = {
    private: 3,
    connections: 2,
    circles: 2,
    public: 1,
  };

  const entryLevel = privacyLevel[entryAudience] || 1;
  const chapterLevel = privacyLevel[chapterPrivacy] || 1;

  // Return the most restrictive (highest level)
  if (entryLevel >= chapterLevel) {
    return entryAudience;
  }
  return chapterPrivacy === 'circles' ? 'connections' : chapterPrivacy;
}

/**
 * Check if an entry should be visible to the current user
 * Used when displaying entries (e.g., in chapters, world feed, etc.)
 * @param {object} entry - The journal entry
 * @param {object} chapter - The chapter (if entry is in a chapter)
 * @param {string} currentUserId - The current user's ID
 * @param {string} creatorUserId - The entry creator's ID
 * @returns {boolean} Whether the entry is visible
 */
export function isEntryVisible(entry, chapter, currentUserId, creatorUserId) {
  // Users always see their own entries
  if (currentUserId === creatorUserId) {
    return true;
  }

  // Get the effective privacy for this entry
  const entryAudience = entry.audience || 'private';
  const effectivePrivacy = chapter 
    ? getEffectivePrivacy(entryAudience, chapter.privacy || 'private')
    : entryAudience;

  // If effective privacy is private, only creator sees it
  if (effectivePrivacy === 'private') {
    return false;
  }

  // If connections/circles, user would need to be in that circle
  // (connection check would be handled elsewhere)
  return effectivePrivacy === 'connections' || effectivePrivacy === 'public';
}