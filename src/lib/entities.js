import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const getUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

const stripUndefined = (obj) => {
  const result = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) result[key] = value;
  });
  return result;
};

const toPlainObject = (docSnap) => {
  const data = docSnap.data();
  const result = { id: docSnap.id, ...data };
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Timestamp) {
      result[key] = result[key].toDate().toISOString();
    }
  });
  return result;
};

const createEntity = (collectionName) => ({
  async list(orderByField = 'created_date', limitCount = 100) {
    const userId = getUserId();
    if (!userId) return [];

    let field = orderByField;
    let direction = 'asc';
    if (orderByField?.startsWith('-')) {
      field = orderByField.slice(1);
      direction = 'desc';
    }

    try {
      const q = field
        ? query(
            collection(db, collectionName),
            where('user_id', '==', userId),
            orderBy(field, direction),
            limit(limitCount)
          )
        : query(
            collection(db, collectionName),
            where('user_id', '==', userId),
            limit(limitCount)
          );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(toPlainObject);
    } catch {
      const q = query(
        collection(db, collectionName),
        where('user_id', '==', userId),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(toPlainObject);
    }
  },

  async filter(conditions) {
    const userId = getUserId();
    if (!userId) return [];

    const constraints = [where('user_id', '==', userId)];
    if (conditions) {
      Object.entries(conditions).forEach(([key, value]) => {
        if (key !== 'user_id') {
          if (value === 'current') {
            constraints.push(where('user_id', '==', userId));
          } else {
            constraints.push(where(key, '==', value));
          }
        }
      });
    }

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toPlainObject);
  },

  async get(id) {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return toPlainObject(docSnap);
    return null;
  },

  async create(data) {
    const userId = getUserId();
    if (!userId) {
      throw new Error('You must be signed in to perform this action. Please sign in and try again.');
    }
    const payload = stripUndefined({
      ...data,
      user_id: userId,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });
    const docRef = await addDoc(collection(db, collectionName), payload);
    return { id: docRef.id, ...payload };
  },

  async update(id, data) {
    const userId = getUserId();
    if (!userId) {
      throw new Error('You must be signed in to perform this action. Please sign in and try again.');
    }
    const docRef = doc(db, collectionName, id);
    const payload = stripUndefined({ ...data, updated_date: new Date().toISOString() });
    await updateDoc(docRef, payload);
    return { id, ...payload };
  },

  async delete(id) {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { id };
  },
});

export async function findConnectionByToken(token) {
  try {
    const q = query(
      collection(db, 'connections'),
      where('invite_token', '==', token),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return toPlainObject(snapshot.docs[0]);
  } catch {
    return null;
  }
}

export async function findCapsuleByToken(token) {
  try {
    const q = query(
      collection(db, 'moment_capsules'),
      where('invite_link_token', '==', token),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return toPlainObject(snapshot.docs[0]);
  } catch {
    return null;
  }
}

// Query entries visible to the current user (own + connections' public/connections posts)
export async function listFeedEntries(connectionUserIds = []) {
  const userId = getUserId();
  if (!userId) return [];

  try {
    // Get own entries
    const ownQ = query(
      collection(db, 'journal_entries'),
      where('user_id', '==', userId),
      orderBy('created_date', 'desc'),
      limit(100)
    );
    const ownSnap = await getDocs(ownQ);
    const ownEntries = ownSnap.docs.map(toPlainObject).filter(e => !e.is_deleted);

    // Get connections' public + connections entries
    let connectionEntries = [];
    if (connectionUserIds.length > 0) {
      // Firestore 'in' supports up to 30 items
      const chunks = [];
      for (let i = 0; i < connectionUserIds.length; i += 30) {
        chunks.push(connectionUserIds.slice(i, i + 30));
      }
      for (const chunk of chunks) {
        const connQ = query(
          collection(db, 'journal_entries'),
          where('user_id', 'in', chunk),
          orderBy('created_date', 'desc'),
          limit(100)
        );
        const connSnap = await getDocs(connQ);
        const entries = connSnap.docs
          .map(toPlainObject)
          .filter(e => !e.is_deleted && (e.audience === 'public' || e.audience === 'connections'));
        connectionEntries.push(...entries);
      }
    }

    return [...ownEntries, ...connectionEntries].sort(
      (a, b) => new Date(b.created_date) - new Date(a.created_date)
    );
  } catch (err) {
    console.error('listFeedEntries error:', err);
    return [];
  }
}

// Query all public entries (for unauthenticated feeds)
export async function listPublicEntries(limitCount = 50) {
  try {
    const q = query(
      collection(db, 'journal_entries'),
      where('audience', '==', 'public'),
      orderBy('created_date', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(toPlainObject).filter(e => !e.is_deleted);
  } catch (err) {
    console.error('listPublicEntries error:', err);
    return [];
  }
}

// Query all user profiles (not user-scoped)
export async function listAllProfiles() {
  try {
    const snap = await getDocs(collection(db, 'user_profiles'));
    return snap.docs.map(toPlainObject);
  } catch (err) {
    console.error('listAllProfiles error:', err);
    return [];
  }
}

export const entities = {
  UserProfile: createEntity('user_profiles'),
  JournalEntry: createEntity('journal_entries'),
  Chapter: createEntity('chapters'),
  Connection: createEntity('connections'),
  MomentCapsule: createEntity('moment_capsules'),
  CapsuleContribution: createEntity('capsule_contributions'),
  Milestone: createEntity('milestones'),
  Circle: createEntity('circles'),
  CircleMember: createEntity('circle_members'),
  Trustee: createEntity('trustees'),
  LifeTrustee: createEntity('life_trustees'),
  MemorialSetting: createEntity('memorial_settings'),
  FamilyRelationship: createEntity('family_relationships'),
  Notification: createEntity('notifications'),
  FamilyMember: createEntity('family_members'),
  Post: createEntity('posts'),
  Comment: createEntity('comments'),
  Location: createEntity('locations'),
};
