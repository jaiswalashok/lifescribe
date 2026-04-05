// Mood ring color mapping
export const MOOD_COLORS = {
  very_happy: '#FFD700',
  happy: '#90EE90',
  normal: '#D3D3D3',
  calm: '#87CEEB',
  loving: '#FFB6C1',
  energised: '#FFA500',
  motivated: '#9370DB',
  tired: '#B0C4DE',
  sad: '#6495ED',
  very_sad: '#4169E1',
  unwell: '#DDA0DD',
  angry: '#FF6347',
  very_glad: '#3CB371',
  upset: '#CD5C5C',
  grateful: '#F0E68C',
  nostalgic: '#DEB887',
  playful: '#FF69B4',
  reflective: '#778899',
  peaceful: '#98FB98',
};

export const DEFAULT_MOOD_COLOR = '#E0E0E0';

export const MOOD_OPTIONS = [
  { value: 'very_happy', label: 'Very Happy', emoji: '😄' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'normal', label: 'Normal', emoji: '😐' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'very_sad', label: 'Very Sad', emoji: '😭' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'very_glad', label: 'Very Glad', emoji: '🥰' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'unwell', label: 'Unwell', emoji: '🤒' },
  { value: 'energised', label: 'Energised', emoji: '⚡' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'motivated', label: 'Motivated', emoji: '💪' },
  { value: 'loving', label: 'Loving', emoji: '🥰' },
  { value: 'upset', label: 'Upset', emoji: '😤' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
  { value: 'nostalgic', label: 'Nostalgic', emoji: '🌅' },
  { value: 'playful', label: 'Playful', emoji: '🎈' },
  { value: 'reflective', label: 'Reflective', emoji: '🪞' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️' },
];

export const SLEEP_OPTIONS = [
  { value: 'great', label: 'Great', emoji: '✨' },
  { value: 'energised', label: 'Energised', emoji: '🌟' },
  { value: 'well_rested', label: 'Well Rested', emoji: '😴' },
  { value: 'good', label: 'Good', emoji: '👍' },
  { value: 'rested', label: 'Rested', emoji: '💤' },
  { value: 'tired', label: 'Tired', emoji: '😪' },
  { value: 'poor', label: 'Poor', emoji: '😩' },
  { value: 'no_sleep', label: 'No Sleep', emoji: '😵' },
];

export const MOTIVATION_OPTIONS = [
  { value: 'very_high', label: 'Very High', emoji: '🔥' },
  { value: 'very_motivated', label: 'Very Motivated', emoji: '🚀' },
  { value: 'high', label: 'High', emoji: '⚡' },
  { value: 'motivated', label: 'Motivated', emoji: '✅' },
  { value: 'average', label: 'Average', emoji: '😐' },
  { value: 'not_motivated', label: 'Not Motivated', emoji: '😑' },
  { value: 'demotivated', label: 'Demotivated', emoji: '😞' },
];

export const MILESTONE_TYPES = [
  { value: 'romantic', label: 'Romantic', emoji: '❤️' },
  { value: 'professional', label: 'Professional', emoji: '💼' },
  { value: 'family', label: 'Family', emoji: '🏠' },
  { value: 'personal', label: 'Personal', emoji: '⭐' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Bahasa Malaysia' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'th', label: 'Thai' },
  { code: 'vi', label: 'Vietnamese' },
];

export const getMoodColor = (mood) => {
  return mood ? (MOOD_COLORS[mood] || DEFAULT_MOOD_COLOR) : DEFAULT_MOOD_COLOR;
};

export const getMoodLabel = (mood) => {
  const found = MOOD_OPTIONS.find(m => m.value === mood);
  return found ? `${found.emoji} ${found.label}` : '';
};

export const getSleepLabel = (sleep) => {
  const found = SLEEP_OPTIONS.find(s => s.value === sleep);
  return found ? `${found.emoji} ${found.label}` : '';
};

export const getMotivationLabel = (motivation) => {
  const found = MOTIVATION_OPTIONS.find(m => m.value === motivation);
  return found ? `${found.emoji} ${found.label}` : '';
};