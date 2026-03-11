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
    const payload = stripUndefined({
      ...data,
      user_id: data.user_id === 'current' ? userId : userId,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });
    const docRef = await addDoc(collection(db, collectionName), payload);
    return { id: docRef.id, ...payload };
  },

  async update(id, data) {
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
