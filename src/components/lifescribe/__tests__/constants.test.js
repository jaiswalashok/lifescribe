import {
  getMoodColor,
  getMoodLabel,
  getSleepLabel,
  getMotivationLabel,
  MOOD_OPTIONS,
  SLEEP_OPTIONS,
  MOTIVATION_OPTIONS,
  MOOD_COLORS,
  DEFAULT_MOOD_COLOR,
} from '../constants';

describe('Constants', () => {
  describe('getMoodColor', () => {
    it('should return the correct color for a valid mood', () => {
      expect(getMoodColor('very_happy')).toBe('#FFD700');
      expect(getMoodColor('happy')).toBe('#90EE90');
      expect(getMoodColor('sad')).toBe('#6495ED');
      expect(getMoodColor('peaceful')).toBe('#98FB98');
    });

    it('should return DEFAULT_MOOD_COLOR for unknown mood', () => {
      expect(getMoodColor('unknown_mood')).toBe(DEFAULT_MOOD_COLOR);
    });

    it('should return DEFAULT_MOOD_COLOR for null or undefined', () => {
      expect(getMoodColor(null)).toBe(DEFAULT_MOOD_COLOR);
      expect(getMoodColor(undefined)).toBe(DEFAULT_MOOD_COLOR);
    });

    it('should return DEFAULT_MOOD_COLOR for empty string', () => {
      expect(getMoodColor('')).toBe(DEFAULT_MOOD_COLOR);
    });
  });

  describe('getMoodLabel', () => {
    it('should return emoji and label for valid mood', () => {
      expect(getMoodLabel('very_happy')).toBe('😄 Very Happy');
      expect(getMoodLabel('happy')).toBe('😊 Happy');
      expect(getMoodLabel('sad')).toBe('😢 Sad');
      expect(getMoodLabel('grateful')).toBe('🙏 Grateful');
    });

    it('should return empty string for invalid mood', () => {
      expect(getMoodLabel('unknown_mood')).toBe('');
      expect(getMoodLabel(null)).toBe('');
      expect(getMoodLabel(undefined)).toBe('');
    });
  });

  describe('getSleepLabel', () => {
    it('should return emoji and label for valid sleep value', () => {
      expect(getSleepLabel('great')).toBe('✨ Great');
      expect(getSleepLabel('well_rested')).toBe('😴 Well Rested');
      expect(getSleepLabel('tired')).toBe('😪 Tired');
      expect(getSleepLabel('no_sleep')).toBe('😵 No Sleep');
    });

    it('should return empty string for invalid sleep value', () => {
      expect(getSleepLabel('unknown')).toBe('');
      expect(getSleepLabel(null)).toBe('');
      expect(getSleepLabel(undefined)).toBe('');
    });
  });

  describe('getMotivationLabel', () => {
    it('should return emoji and label for valid motivation value', () => {
      expect(getMotivationLabel('very_high')).toBe('🔥 Very High');
      expect(getMotivationLabel('very_motivated')).toBe('🚀 Very Motivated');
      expect(getMotivationLabel('motivated')).toBe('✅ Motivated');
      expect(getMotivationLabel('demotivated')).toBe('😞 Demotivated');
    });

    it('should return empty string for invalid motivation value', () => {
      expect(getMotivationLabel('unknown')).toBe('');
      expect(getMotivationLabel(null)).toBe('');
      expect(getMotivationLabel(undefined)).toBe('');
    });
  });

  describe('MOOD_OPTIONS', () => {
    it('should contain all expected moods', () => {
      const expectedMoods = [
        'very_happy',
        'happy',
        'normal',
        'sad',
        'very_sad',
        'angry',
        'very_glad',
        'tired',
        'unwell',
        'energised',
        'calm',
        'motivated',
        'loving',
        'upset',
        'grateful',
        'nostalgic',
        'playful',
        'reflective',
        'peaceful',
      ];

      const moodValues = MOOD_OPTIONS.map((m) => m.value);
      expectedMoods.forEach((mood) => {
        expect(moodValues).toContain(mood);
      });
    });

    it('should have correct structure with value, label, and emoji', () => {
      MOOD_OPTIONS.forEach((mood) => {
        expect(mood).toHaveProperty('value');
        expect(mood).toHaveProperty('label');
        expect(mood).toHaveProperty('emoji');
        expect(typeof mood.value).toBe('string');
        expect(typeof mood.label).toBe('string');
        expect(typeof mood.emoji).toBe('string');
      });
    });
  });

  describe('SLEEP_OPTIONS', () => {
    it('should contain all expected sleep options', () => {
      const expectedSleep = ['great', 'energised', 'well_rested', 'good', 'rested', 'tired', 'poor', 'no_sleep'];

      const sleepValues = SLEEP_OPTIONS.map((s) => s.value);
      expectedSleep.forEach((sleep) => {
        expect(sleepValues).toContain(sleep);
      });
    });

    it('should have correct structure', () => {
      SLEEP_OPTIONS.forEach((sleep) => {
        expect(sleep).toHaveProperty('value');
        expect(sleep).toHaveProperty('label');
        expect(sleep).toHaveProperty('emoji');
      });
    });
  });

  describe('MOTIVATION_OPTIONS', () => {
    it('should contain all expected motivation options', () => {
      const expectedMotivation = [
        'very_high',
        'very_motivated',
        'high',
        'motivated',
        'average',
        'not_motivated',
        'demotivated',
      ];

      const motivationValues = MOTIVATION_OPTIONS.map((m) => m.value);
      expectedMotivation.forEach((motivation) => {
        expect(motivationValues).toContain(motivation);
      });
    });

    it('should have correct structure', () => {
      MOTIVATION_OPTIONS.forEach((motivation) => {
        expect(motivation).toHaveProperty('value');
        expect(motivation).toHaveProperty('label');
        expect(motivation).toHaveProperty('emoji');
      });
    });
  });

  describe('MOOD_COLORS', () => {
    it('should have entries for all moods including special ones', () => {
      const requiredMoods = [
        'very_happy',
        'happy',
        'normal',
        'sad',
        'very_sad',
        'angry',
        'very_glad',
        'tired',
        'unwell',
        'energised',
        'calm',
        'motivated',
        'loving',
        'upset',
        'grateful',
        'nostalgic',
        'playful',
        'reflective',
        'peaceful',
      ];

      requiredMoods.forEach((mood) => {
        expect(MOOD_COLORS).toHaveProperty(mood);
        expect(typeof MOOD_COLORS[mood]).toBe('string');
      });
    });

    it('should all be valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      Object.values(MOOD_COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('DEFAULT_MOOD_COLOR', () => {
    it('should be a valid hex color', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      expect(DEFAULT_MOOD_COLOR).toMatch(hexColorRegex);
    });
  });
});
