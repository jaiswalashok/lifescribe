import { base44 } from '../base44Client';

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@test.com',
      displayName: 'Test User',
      photoURL: null,
    },
  },
  db: {},
  storage: {},
}));

jest.mock('@/lib/entities', () => ({
  entities: {
    UserProfile: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    JournalEntry: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Chapter: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Connection: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    MomentCapsule: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    CapsuleContribution: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Milestone: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Circle: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    CircleMember: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Trustee: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    LifeTrustee: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    MemorialSetting: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    FamilyRelationship: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Notification: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    FamilyMember: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Post: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Comment: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
    Location: {
      list: jest.fn(),
      filter: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      get: jest.fn(),
    },
  },
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

describe('base44Client', () => {
  describe('base44.entities', () => {
    it('should have all expected collections', () => {
      const expectedCollections = [
        'UserProfile',
        'JournalEntry',
        'Chapter',
        'Connection',
        'MomentCapsule',
        'CapsuleContribution',
        'Milestone',
        'Circle',
        'CircleMember',
        'Trustee',
        'LifeTrustee',
        'MemorialSetting',
        'FamilyRelationship',
        'Notification',
        'FamilyMember',
        'Post',
        'Comment',
        'Location',
      ];

      expectedCollections.forEach((collection) => {
        expect(base44.entities).toHaveProperty(collection);
      });
    });
  });

  describe('base44.auth', () => {
    it('should have expected auth methods', () => {
      expect(base44.auth).toHaveProperty('me');
      expect(base44.auth).toHaveProperty('redirectToLogin');
      expect(base44.auth).toHaveProperty('logout');
      expect(base44.auth).toHaveProperty('loginWithEmail');
      expect(base44.auth).toHaveProperty('registerWithEmail');
      expect(base44.auth).toHaveProperty('loginWithGoogle');
    });

    it('should have auth methods as functions', () => {
      expect(typeof base44.auth.me).toBe('function');
      expect(typeof base44.auth.redirectToLogin).toBe('function');
      expect(typeof base44.auth.logout).toBe('function');
      expect(typeof base44.auth.loginWithEmail).toBe('function');
      expect(typeof base44.auth.registerWithEmail).toBe('function');
      expect(typeof base44.auth.loginWithGoogle).toBe('function');
    });
  });
});
