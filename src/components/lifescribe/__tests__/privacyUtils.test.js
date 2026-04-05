import { getEffectivePrivacy, isEntryVisible } from '../privacyUtils';

describe('Privacy Utilities', () => {
  describe('getEffectivePrivacy', () => {
    it('should return private when entry is private', () => {
      expect(getEffectivePrivacy('private', 'public')).toBe('private');
      expect(getEffectivePrivacy('private', 'connections')).toBe('private');
      expect(getEffectivePrivacy('private', 'private')).toBe('private');
    });

    it('should return private when chapter is private', () => {
      expect(getEffectivePrivacy('public', 'private')).toBe('private');
      expect(getEffectivePrivacy('connections', 'private')).toBe('private');
    });

    it('should return connections when both allow connections', () => {
      expect(getEffectivePrivacy('connections', 'public')).toBe('connections');
      expect(getEffectivePrivacy('public', 'connections')).toBe('connections');
    });

    it('should handle circles privacy level', () => {
      // 'public' entry + 'circles' chapter → circles is more restrictive, returns 'connections' (mapped from circles)
      expect(getEffectivePrivacy('public', 'circles')).toBe('connections');
      // 'circles' entry + 'public' chapter → circles entry is more restrictive, returns 'circles' (raw value)
      expect(getEffectivePrivacy('circles', 'public')).toBe('circles');
    });

    it('should return public when both are public', () => {
      expect(getEffectivePrivacy('public', 'public')).toBe('public');
    });

    it('should handle undefined/invalid privacy levels', () => {
      // Unknown values default to level 1 (same as public)
      // When entry level >= chapter level, entry audience is returned as-is
      expect(getEffectivePrivacy('unknown', 'public')).toBe('unknown');
      expect(getEffectivePrivacy('public', 'unknown')).toBe('public');
    });
  });

  describe('isEntryVisible', () => {
    const currentUserId = 'user123';
    const creatorUserId = 'user456';

    it('should return true for own entries', () => {
      const entry = { audience: 'private' };
      expect(isEntryVisible(entry, null, currentUserId, currentUserId)).toBe(true);
    });

    it('should return false for private entries from others', () => {
      const entry = { audience: 'private' };
      expect(isEntryVisible(entry, null, currentUserId, creatorUserId)).toBe(false);
    });

    it('should return true for public entries', () => {
      const entry = { audience: 'public' };
      expect(isEntryVisible(entry, null, currentUserId, creatorUserId)).toBe(true);
    });

    it('should return true for connections entries', () => {
      const entry = { audience: 'connections' };
      expect(isEntryVisible(entry, null, currentUserId, creatorUserId)).toBe(true);
    });

    it('should respect chapter privacy', () => {
      const entry = { audience: 'public' };
      const chapter = { privacy: 'private' };
      expect(isEntryVisible(entry, chapter, currentUserId, creatorUserId)).toBe(false);
    });

    it('should return true when entry and chapter both allow connections', () => {
      const entry = { audience: 'connections' };
      const chapter = { privacy: 'connections' };
      expect(isEntryVisible(entry, chapter, currentUserId, creatorUserId)).toBe(true);
    });

    it('should use most restrictive privacy when both are set', () => {
      const entry = { audience: 'public' };
      const chapter = { privacy: 'connections' };
      expect(isEntryVisible(entry, chapter, currentUserId, creatorUserId)).toBe(true);
    });

    it('should handle missing audience property', () => {
      const entry = {};
      expect(isEntryVisible(entry, null, currentUserId, creatorUserId)).toBe(false);
    });

    it('should handle missing chapter privacy property', () => {
      // chapter.privacy defaults to 'private' in the code, so public entry + private chapter = private
      const entry = { audience: 'public' };
      const chapter = {};
      expect(isEntryVisible(entry, chapter, currentUserId, creatorUserId)).toBe(false);
    });

    it('should handle circles privacy in chapter', () => {
      const entry = { audience: 'public' };
      const chapter = { privacy: 'circles' };
      // circles maps to connections level, result is 'connections' which is visible
      expect(isEntryVisible(entry, chapter, currentUserId, creatorUserId)).toBe(true);
    });
  });
});
