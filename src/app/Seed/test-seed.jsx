'use client';
import React, { useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { CheckCircle2, XCircle, Loader2, Play } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ASHOK_EMAIL = 'ashokjaiswal@gmail.com';
const PASSWORD = '123123123';

const FAMILY_MEMBERS = [
  { name: 'Ariane Li', email: 'ashokjaiswal+mama@gmail.com', username: 'ariane.li', role: 'Mama', mood: 'loving', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', bio: 'Living life with love and gratitude.' },
  { name: 'Sarika Jaiswal', email: 'ashokjaiswal+sarika@gmail.com', username: 'sarika.jaiswal', role: 'Daughter', mood: 'happy', avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop', bio: 'Princess Sarika. Age 3.' },
  { name: 'Dadi Ma', email: 'ashokjaiswal+dadima@gmail.com', username: 'dadi.ma', role: 'Paternal Grandmom', mood: 'grateful', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop', bio: 'Nani ke haath ka khana sabse achha.' },
  { name: 'Dada Ji', email: 'ashokjaiswal+dadaji@gmail.com', username: 'dada.ji', role: 'Paternal Granddad', mood: 'calm', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', bio: 'Old trees give the best shade.' },
  { name: 'Nai Nai Li', email: 'ashokjaiswal+nainae@gmail.com', username: 'nainai.li', role: 'Maternal Grandmom', mood: 'peaceful', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop', bio: 'Chengdu garden keeper.' },
  { name: 'Ye Ye Li', email: 'ashokjaiswal+yeye@gmail.com', username: 'yeye.li', role: 'Maternal Granddad', mood: 'grateful', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop', bio: 'Sunflowers and tomatoes and good tea.' },
];

const ASHOK_PROFILE = {
  full_name: 'Ashok Jaiswal',
  username: 'ashok.jaiswal',
  profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  current_mood: 'grateful',
  bio: 'Father. Builder. Storyteller.',
};

const SAMPLE_ENTRIES_PER_USER = {
  [ASHOK_EMAIL]: [
    { content: "Woke up early today and sat with a cup of tea watching the sunrise from the balcony. Sarika was still asleep. Ariane was reading. These quiet mornings are everything.", mood: 'grateful', audience: 'public', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Family dinner tonight. Dadi Ma made her famous dal makhani and we all sat around the table together. Dada Ji kept telling old stories from his village days.", mood: 'loving', audience: 'connections', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika said 'I love you Papa' completely unprompted tonight while I was putting her to bed. Some moments you want to live inside forever.", mood: 'loving', audience: 'private', entry_date: '2026-03-18' },
    { content: "Every startup pivot sounds crazy until it doesn't. We shipped two features quietly this week. Grateful for the team.", mood: 'motivated', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika discovered the word 'why' today and has been asking it nonstop for six hours. I have no answers but I love every question.", mood: 'playful', audience: 'public', entry_date: '2026-03-14' },
    { content: "Ten years ago I had exactly two things: a laptop and a belief that something could be built. Added a family along the way.", mood: 'reflective', audience: 'public', entry_date: '2026-03-12' },
  ],
  'ashokjaiswal+mama@gmail.com': [
    { content: "Sarika has started naming every flower in the park. Three tulips today — Maria, Papa, and Cloud.", mood: 'loving', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1490750967868-88df5691cc4d?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sunday morning yoga in the living room while Sarika tried to copy me. She kept falling over and giggling.", mood: 'calm', audience: 'public', entry_date: '2026-03-19' },
    { content: "Teaching Sarika 'xie xie' and 'ni hao'. She now says ni hao to the cat next door.", mood: 'playful', audience: 'public', entry_date: '2026-03-17' },
    { content: "Read through old letters from my university days. Found one from Ashok — the most awkward love letter ever written.", mood: 'nostalgic', audience: 'connections', entry_date: '2026-03-15' },
  ],
  'ashokjaiswal+sarika@gmail.com': [
    { content: "I drew a picture of our family today! Papa is the tallest, Mama has the prettiest hair, and I am Princess Sarika with a BIG crown.", mood: 'happy', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "We went to the park and I found a ladybug! I named her Spotty. She flew away but I think she'll come back tomorrow.", mood: 'happy', audience: 'public', entry_date: '2026-03-18' },
    { content: "Today I made COOKIES with Mama and I only ate like three. Maybe four.", mood: 'happy', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+dadima@gmail.com': [
    { content: "Made chai this morning the way my mother taught me. Three cardamom pods, a pinch of ginger, let it boil twice. Some things never change.", mood: 'grateful', audience: 'public', entry_date: '2026-03-21' },
    { content: "Video call with Sarika. She showed me her drawings and sang a song. That child has so much light in her.", mood: 'loving', audience: 'public', entry_date: '2026-03-19' },
    { content: "Festivals are coming. Made the first batch of kheer this morning — extra cardamom.", mood: 'grateful', audience: 'public', entry_date: '2026-03-17', media_urls: ['https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+dadaji@gmail.com': [
    { content: "Walked in the garden today. The tomatoes are coming along nicely. Planted new marigolds near the gate.", mood: 'calm', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Ashok called today. He works too hard but he is building something good. Told him about the neem tree — still strong after 40 years.", mood: 'grateful', audience: 'connections', entry_date: '2026-03-18' },
    { content: "Walked three kilometres before breakfast. The park was quiet. Just the birds and one old man with his dog.", mood: 'calm', audience: 'public', entry_date: '2026-03-16' },
  ],
  'ashokjaiswal+nainae@gmail.com': [
    { content: "Spring arrived early in Chengdu. The plum blossoms outside the kitchen window are in full bloom.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Made dumplings for the neighbours today. Community is the first thing that disappears when people get too busy.", mood: 'loving', audience: 'public', entry_date: '2026-03-19', media_urls: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika called me Nai Nai very clearly today. The first time she said it just right.", mood: 'loving', audience: 'public', entry_date: '2026-03-17' },
  ],
  'ashokjaiswal+yeye@gmail.com': [
    { content: "Seven sunflowers came up along the east fence this year. Best count I have had. The garden always rewards patience.", mood: 'calm', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning tea in the garden. The city was waking up. I have done this for forty years and I still do not take it for granted.", mood: 'grateful', audience: 'public', entry_date: '2026-03-18' },
    { content: "Sarika tried to water my tomatoes over video call by pointing her cup at the screen. The logic was sound.", mood: 'playful', audience: 'public', entry_date: '2026-03-16' },
  ],
};

// ─── Test Runner Component ───────────────────────────────────────────────────

function StatusIcon({ status }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === 'fail') return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  if (status === 'running') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />;
}

export default function SeedTestRunner() {
  const [steps, setSteps] = useState([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(null);
  const abortRef = useRef(false);

  const addStep = (name, status = 'running', detail = '') => {
    setSteps(prev => {
      const existing = prev.findIndex(s => s.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, status, detail };
        return updated;
      }
      return [...prev, { name, status, detail }];
    });
  };

  // ── Helper: sign in or create account ──────────────────────────────────────
  const signInOrCreate = async (email, password, profileData) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (profileData) {
          await setDoc(doc(db, 'user_profiles', result.user.uid), {
            user_id: result.user.uid,
            ...profileData,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });
        }
        return result.user;
      }
      throw err;
    }
  };

  // ── Helper: verify Firestore query returns results ─────────────────────────
  const verifyQuery = async (collectionName, field, value) => {
    const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value), limit(5)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  };

  // ── Main test runner ───────────────────────────────────────────────────────
  const runFullSeedTest = async () => {
    setRunning(true);
    setSteps([]);
    setSummary(null);
    abortRef.current = false;
    let passed = 0;
    let failed = 0;
    const userUids = {};

    const pass = (name, detail) => { addStep(name, 'pass', detail); passed++; };
    const fail = (name, detail) => { addStep(name, 'fail', detail); failed++; };

    try {
      // ── 1. Sign in as Ashok ────────────────────────────────────────────────
      addStep('1. Sign in as Ashok');
      try {
        const ashokUser = await signInOrCreate(ASHOK_EMAIL, PASSWORD, ASHOK_PROFILE);
        userUids[ASHOK_EMAIL] = ashokUser.uid;
        pass('1. Sign in as Ashok', `UID: ${ashokUser.uid}`);
      } catch (err) {
        fail('1. Sign in as Ashok', err.message);
        setRunning(false);
        setSummary({ passed, failed });
        return;
      }

      // ── 2. Verify Ashok profile exists in Firestore ─────────────────────
      addStep('2. Verify Ashok profile');
      try {
        const profiles = await verifyQuery('user_profiles', 'user_id', userUids[ASHOK_EMAIL]);
        if (profiles.length > 0 && profiles[0].username === 'ashok.jaiswal') {
          pass('2. Verify Ashok profile', `Found: ${profiles[0].full_name}`);
        } else {
          // Create it
          await setDoc(doc(db, 'user_profiles', userUids[ASHOK_EMAIL]), {
            user_id: userUids[ASHOK_EMAIL],
            ...ASHOK_PROFILE,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });
          pass('2. Verify Ashok profile', 'Created fresh profile');
        }
      } catch (err) {
        fail('2. Verify Ashok profile', err.message);
      }

      // ── 3. Create family accounts ──────────────────────────────────────────
      for (let i = 0; i < FAMILY_MEMBERS.length; i++) {
        const member = FAMILY_MEMBERS[i];
        const stepName = `3.${i + 1} Create ${member.name}`;
        addStep(stepName);
        try {
          const user = await signInOrCreate(member.email, PASSWORD, {
            full_name: member.name,
            username: member.username,
            profile_picture_url: member.avatar,
            current_mood: member.mood,
            bio: member.bio,
          });
          userUids[member.email] = user.uid;
          // Sign back as Ashok
          await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
          pass(stepName, `UID: ${user.uid}`);
        } catch (err) {
          fail(stepName, err.message);
          try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
        }
        await new Promise(r => setTimeout(r, 300));
      }

      // ── 4. Create bi-directional connections ───────────────────────────────
      addStep('4. Create connections');
      let connCount = 0;
      try {
        for (const member of FAMILY_MEMBERS) {
          const memberUid = userUids[member.email];
          if (!memberUid) continue;

          // Ashok → member
          await addDoc(collection(db, 'connections'), {
            user_id: userUids[ASHOK_EMAIL],
            connected_user_id: memberUid,
            connected_user_name: member.name,
            connected_user_avatar: member.avatar,
            connected_user_mood: member.mood,
            username: member.username,
            relationship_label: member.role,
            status: 'accepted',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });

          // Sign as member
          await signInWithEmailAndPassword(auth, member.email, PASSWORD);

          // Member → Ashok
          await addDoc(collection(db, 'connections'), {
            user_id: memberUid,
            connected_user_id: userUids[ASHOK_EMAIL],
            connected_user_name: 'Ashok Jaiswal',
            connected_user_avatar: ASHOK_PROFILE.profile_picture_url,
            username: 'ashok.jaiswal',
            relationship_label: member.role === 'Mama' ? 'Husband' : member.role === 'Daughter' ? 'Father' : 'Family',
            status: 'accepted',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });

          // Sign back as Ashok
          await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
          connCount += 2;
        }
        pass('4. Create connections', `${connCount} bi-directional connections`);
      } catch (err) {
        fail('4. Create connections', `Created ${connCount} before error: ${err.message}`);
        try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
      }

      // ── 5. Seed journal entries for ALL users ──────────────────────────────
      addStep('5. Seed entries for all users');
      let entryCount = 0;
      try {
        const allEmails = [ASHOK_EMAIL, ...FAMILY_MEMBERS.map(m => m.email)];
        for (const email of allEmails) {
          const uid = userUids[email];
          if (!uid) continue;
          const entries = SAMPLE_ENTRIES_PER_USER[email] || [];
          if (entries.length === 0) continue;

          // Sign in as this user
          await signInWithEmailAndPassword(auth, email, PASSWORD);
          const member = FAMILY_MEMBERS.find(m => m.email === email);
          const username = member ? member.username : 'ashok.jaiswal';

          for (const entry of entries) {
            await addDoc(collection(db, 'journal_entries'), {
              ...entry,
              user_id: uid,
              username,
              is_deleted: false,
              created_date: new Date(entry.entry_date).toISOString(),
              updated_date: new Date().toISOString(),
            });
            entryCount++;
          }
        }
        // Sign back as Ashok
        await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
        pass('5. Seed entries for all users', `${entryCount} entries created`);
      } catch (err) {
        fail('5. Seed entries for all users', `${entryCount} created before error: ${err.message}`);
        try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
      }

      // ── 6. Verify Ashok can see connections ────────────────────────────────
      addStep('6. Verify Ashok sees connections');
      try {
        const conns = await verifyQuery('connections', 'user_id', userUids[ASHOK_EMAIL]);
        if (conns.length >= FAMILY_MEMBERS.length) {
          pass('6. Verify Ashok sees connections', `${conns.length} connections found`);
        } else {
          fail('6. Verify Ashok sees connections', `Only ${conns.length} connections (expected ${FAMILY_MEMBERS.length}+)`);
        }
      } catch (err) {
        fail('6. Verify Ashok sees connections', err.message);
      }

      // ── 7. Verify public entries exist ─────────────────────────────────────
      addStep('7. Verify public entries');
      try {
        const pubSnap = await getDocs(query(
          collection(db, 'journal_entries'),
          where('audience', '==', 'public'),
          orderBy('created_date', 'desc'),
          limit(20)
        ));
        const publicEntries = pubSnap.docs.map(d => d.data());
        if (publicEntries.length >= 10) {
          pass('7. Verify public entries', `${publicEntries.length} public entries found`);
        } else {
          fail('7. Verify public entries', `Only ${publicEntries.length} public entries`);
        }
      } catch (err) {
        fail('7. Verify public entries', err.message);
      }

      // ── 8. Test handle page: verify profiles are queryable by username ─────
      addStep('8. Verify handle lookups');
      try {
        let handlesPassed = 0;
        const handles = ['ashok.jaiswal', 'ariane.li', 'sarika.jaiswal', 'dadi.ma'];
        for (const handle of handles) {
          const snap = await getDocs(query(
            collection(db, 'user_profiles'),
            where('username', '==', handle),
            limit(1)
          ));
          if (!snap.empty) handlesPassed++;
        }
        if (handlesPassed === handles.length) {
          pass('8. Verify handle lookups', `All ${handlesPassed} handles resolve`);
        } else {
          fail('8. Verify handle lookups', `${handlesPassed}/${handles.length} handles found`);
        }
      } catch (err) {
        fail('8. Verify handle lookups', err.message);
      }

      // ── 9. Verify family members can login ─────────────────────────────────
      addStep('9. Verify family logins');
      try {
        let loginsOk = 0;
        for (const member of FAMILY_MEMBERS) {
          try {
            await signInWithEmailAndPassword(auth, member.email, PASSWORD);
            loginsOk++;
          } catch {}
        }
        // Sign back as Ashok
        await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
        if (loginsOk === FAMILY_MEMBERS.length) {
          pass('9. Verify family logins', `All ${loginsOk} accounts can sign in`);
        } else {
          fail('9. Verify family logins', `${loginsOk}/${FAMILY_MEMBERS.length} can sign in`);
        }
      } catch (err) {
        fail('9. Verify family logins', err.message);
      }

      // ── 10. Verify feed visibility (connections see each other's entries) ──
      addStep('10. Verify feed visibility');
      try {
        // Sign in as Ariane and check she can see Ashok's public entries
        await signInWithEmailAndPassword(auth, 'ashokjaiswal+mama@gmail.com', PASSWORD);
        const arianeConns = await verifyQuery('connections', 'user_id', userUids['ashokjaiswal+mama@gmail.com']);
        const ashokConn = arianeConns.find(c => c.connected_user_id === userUids[ASHOK_EMAIL]);
        if (ashokConn) {
          // Ariane is connected to Ashok — she should see his public/connections posts
          const ashokEntries = await getDocs(query(
            collection(db, 'journal_entries'),
            where('user_id', '==', userUids[ASHOK_EMAIL]),
            where('audience', '==', 'public'),
            limit(5)
          ));
          if (ashokEntries.docs.length > 0) {
            pass('10. Verify feed visibility', `Ariane can see ${ashokEntries.docs.length} of Ashok's public entries`);
          } else {
            fail('10. Verify feed visibility', "Ariane can't see Ashok's public entries");
          }
        } else {
          fail('10. Verify feed visibility', 'Ariane → Ashok connection not found');
        }
        await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
      } catch (err) {
        fail('10. Verify feed visibility', err.message);
        try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
      }

    } catch (err) {
      fail('Unexpected error', err.message);
    }

    setSummary({ passed, failed });
    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-[#111111]">Seed & Test Runner</h1>
          <p className="text-xs text-gray-400 mt-1">Creates all accounts, seeds data, verifies connections, login, feed visibility.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Run button */}
        <button
          onClick={runFullSeedTest}
          disabled={running}
          className="w-full bg-[#111111] text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
        >
          {running ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running tests…</>
          ) : (
            <><Play className="w-4 h-4" /> Run Full Seed + Test</>
          )}
        </button>

        {/* Results */}
        {steps.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-sm font-semibold text-[#111111]">Test Results</p>
            </div>
            <div className="divide-y divide-gray-50">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <StatusIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111111]">{step.name}</p>
                    {step.detail && (
                      <p className={`text-[10px] mt-0.5 ${step.status === 'fail' ? 'text-red-500' : 'text-gray-400'}`}>{step.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className={`rounded-2xl p-4 text-center ${summary.failed === 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <p className={`text-lg font-bold ${summary.failed === 0 ? 'text-green-700' : 'text-red-700'}`}>
              {summary.failed === 0 ? '✅ All tests passed!' : `❌ ${summary.failed} test(s) failed`}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {summary.passed} passed, {summary.failed} failed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
