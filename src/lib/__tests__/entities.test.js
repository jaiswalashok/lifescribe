import { entities, findConnectionByToken, findCapsuleByToken, listFeedEntries, listPublicEntries, listAllProfiles } from '../entities';

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@test.com',
    },
  },
  db: {},
}));

jest.mock('firebase/firestore', () => {
  class Timestamp {
    static fromDate = jest.fn();
    static now = jest.fn();
    toDate = jest.fn();
  }

  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    serverTimestamp: jest.fn(),
    Timestamp,
  };
});

describe('Entities', () => {
  describe('Entities Collections', () => {
    it('should have expected collections', () => {
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
        expect(entities).toHaveProperty(collection);
        expect(entities[collection]).toBeDefined();
      });
    });
  });

  describe('Entity methods', () => {
    it('should have list, filter, get, create, update, delete methods', () => {
      const entity = entities.UserProfile;

      expect(entity).toHaveProperty('list');
      expect(entity).toHaveProperty('filter');
      expect(entity).toHaveProperty('create');
      expect(entity).toHaveProperty('update');
      expect(entity).toHaveProperty('delete');
      expect(entity).toHaveProperty('get');

      expect(typeof entity.list).toBe('function');
      expect(typeof entity.filter).toBe('function');
      expect(typeof entity.create).toBe('function');
      expect(typeof entity.update).toBe('function');
      expect(typeof entity.delete).toBe('function');
      expect(typeof entity.get).toBe('function');
    });
  });

  describe('findConnectionByToken', () => {
    it('should be a function', () => {
      expect(typeof findConnectionByToken).toBe('function');
    });
  });

  describe('findCapsuleByToken', () => {
    it('should be a function', () => {
      expect(typeof findCapsuleByToken).toBe('function');
    });
  });

  describe('listFeedEntries', () => {
    it('should be a function', () => {
      expect(typeof listFeedEntries).toBe('function');
    });
  });

  describe('listPublicEntries', () => {
    it('should be a function', () => {
      expect(typeof listPublicEntries).toBe('function');
    });
  });

  describe('listAllProfiles', () => {
    it('should be a function', () => {
      expect(typeof listAllProfiles).toBe('function');
    });
  });
});
