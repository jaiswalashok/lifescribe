'use client';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import {
  CheckCircle2, Circle, Loader2, AlertCircle, Trash2,
  Play, Users, BookOpen, Archive, Lock, Eye, EyeOff, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '@/components/lifescribe/Toast';

// ─── Seed data ────────────────────────────────────────────────────────────────

const ASHOK_EMAIL = 'ashokjaiswal@gmail.com';

const FAMILY_MEMBERS = [
  {
    name: 'Ariane Li', role: 'Mama', email: 'ashokjaiswal+mama@gmail.com',
    username: 'ariane.li',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    mood: 'loving', bio: 'Living life with love and gratitude.',
  },
  {
    name: 'Sarika Jaiswal', role: 'Daughter', email: 'ashokjaiswal+sarika@gmail.com',
    username: 'sarika.jaiswal',
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
    mood: 'happy', bio: 'Princess Sarika. Age 3.',
  },
  {
    name: 'Dadi Ma', role: 'Paternal Grandmom', email: 'ashokjaiswal+dadima@gmail.com',
    username: 'dadi.ma',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop',
    mood: 'grateful', bio: 'Nani ke haath ka khana sabse achha.',
  },
  {
    name: 'Dada Ji', role: 'Paternal Granddad', email: 'ashokjaiswal+dadaji@gmail.com',
    username: 'dada.ji',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    mood: 'calm', bio: 'Old trees give the best shade.',
  },
  {
    name: 'Nai Nai Li', role: 'Maternal Grandmom', email: 'ashokjaiswal+nainae@gmail.com',
    username: 'nainai.li',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop',
    mood: 'peaceful', bio: 'Chengdu garden keeper.',
  },
  {
    name: 'Ye Ye Li', role: 'Maternal Granddad', email: 'ashokjaiswal+yeye@gmail.com',
    username: 'yeye.li',
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop',
    mood: 'grateful', bio: 'Sunflowers and tomatoes and good tea.',
  },
];

const CHAPTERS_DATA = [
  {
    name: 'Family & Home',
    description: 'Our home life, family dinners, everyday moments that make life whole.',
    date_from: '2020-01-01', privacy: 'circles',
    cover_image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=400&fit=crop',
  },
  {
    name: 'Adventures & Travel',
    description: 'Exploring the world — every trip, every discovery, every adventure together.',
    date_from: '2018-01-01', privacy: 'circles',
    cover_image_url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=400&fit=crop',
  },
  {
    name: 'Sarika Growing Up',
    description: 'Every milestone, every laugh, every tiny moment of Sarika finding her way in the world.',
    date_from: '2020-06-01', privacy: 'private',
    cover_image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=400&fit=crop',
  },
  {
    name: 'Work & Building',
    description: 'The grind, the wins, the lessons learned building something from scratch.',
    date_from: '2015-01-01', privacy: 'private',
    cover_image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
  },
  {
    name: 'Memories with Ariane',
    description: 'Our journey together — from the first hello to everything in between.',
    date_from: '2016-01-01', privacy: 'private',
    cover_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=400&fit=crop',
  },
];

const buildEntries = (chapMap) => [
  {
    content: "Woke up early today and sat with a cup of tea watching the sunrise from the balcony. Sarika was still asleep. Ariane was reading. These quiet mornings are everything. I've been thinking about how fast time moves — she was just a baby and now she's running around pretending to be a chef. I need to write more of this down.",
    mood: 'grateful', sleep_quality: 'great', motivation: 'high',
    audience: 'private', entry_date: '2026-03-10',
    chapter_id: chapMap['Family & Home'],
    media_urls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'],
    media_types: ['image'],
  },
  {
    content: "Family dinner tonight. Dadi Ma made her famous dal makhani and we all sat around the table together. Dada Ji kept telling old stories from his village days — about the rains, about the mango trees, about a life I never got to see. I wish I had recorded more of these stories when I was younger.",
    mood: 'loving', sleep_quality: 'good',
    audience: 'connections', entry_date: '2026-03-08',
    chapter_id: chapMap['Family & Home'],
    media_urls: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop'],
    media_types: ['image'],
  },
  {
    content: "Bali. Day 3. The rice paddies in Ubud are exactly as beautiful as every photo promised, maybe more. We rented a scooter and got completely lost — ended up at a small warung where the owner insisted we stay for lunch. Best nasi goreng of my life. Sarika was unbothered by all of it, just wanted to splash in every puddle she saw.",
    mood: 'energised', motivation: 'high',
    audience: 'connections', entry_date: '2026-02-20',
    chapter_id: chapMap['Adventures & Travel'],
    media_urls: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800&h=600&fit=crop',
    ],
    media_types: ['image', 'image'],
  },
  {
    content: "Sarika said 'I love you Papa' completely unprompted tonight while I was putting her to bed. Just out of nowhere. I didn't say anything back for a moment — just held her. Some moments you want to live inside forever.",
    mood: 'loving',
    audience: 'private', entry_date: '2026-03-05',
    chapter_id: chapMap['Sarika Growing Up'],
  },
  {
    content: "Long call with Ye Ye and Nai Nai this morning. They're doing well in Chengdu. Ye Ye showed me his garden over video — he's grown tomatoes, some greens, a row of sunflowers along the fence. Nai Nai made Ariane write down a recipe for tang yuan while we were on the call. We should visit this year.",
    mood: 'nostalgic',
    audience: 'connections', entry_date: '2026-03-03',
    chapter_id: chapMap['Memories with Ariane'],
    media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'],
    media_types: ['image'],
  },
  {
    content: "Shipped two features, had a solid strategy session with the team, and finally cleared out my inbox backlog. Ordered pizza for the team at midnight. Those late nights building something — there's a particular kind of alive I feel in those moments.",
    mood: 'motivated', sleep_quality: 'poor', motivation: 'very_high',
    audience: 'private', entry_date: '2026-03-01',
    chapter_id: chapMap['Work & Building'],
    media_urls: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop'],
    media_types: ['image'],
  },
  {
    content: "Took Sarika to the park for the first time since the rains. She ran straight into a muddy patch and I didn't stop her. Ariane texted 'you let her ruin those shoes didn't you' within minutes. She knows me too well.",
    mood: 'playful',
    audience: 'connections', entry_date: '2026-02-28',
    chapter_id: chapMap['Sarika Growing Up'],
    media_urls: ['https://images.unsplash.com/photo-1473798136956-3b02c7c1e28d?w=800&h=600&fit=crop'],
    media_types: ['image'],
  },
  {
    content: "Visited Dada Ji and Dadi Ma for the weekend. Saturday morning chai on the veranda. The old neem tree is still there. They asked about work, about Sarika's school, about when we're having another baby. Dada Ji walked me through his garden and pointed at every plant like he was introducing me to old friends. I love that man.",
    mood: 'nostalgic', sleep_quality: 'great',
    audience: 'connections', entry_date: '2026-02-22',
    chapter_id: chapMap['Family & Home'],
    media_urls: [
      'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
    ],
    media_types: ['image', 'image'],
  },
  {
    content: "Three years ago today I wrote in an old notebook: 'I want to build something that matters.' Standing in a different place now. Grateful for every detour.",
    mood: 'reflective', motivation: 'high',
    audience: 'private', entry_date: '2026-02-15',
    chapter_id: chapMap['Work & Building'],
  },
  {
    content: "Sarika's birthday. She turned 3. We did a small thing at home — balloons, her favourite cake (strawberry with too many sprinkles), Ariane's parents on video call, my parents driving in from Pune. She wore her little crown the entire day and called herself Princess Sarika. She is not wrong.",
    mood: 'happy', sleep_quality: 'good',
    audience: 'public', entry_date: '2026-02-10',
    chapter_id: chapMap['Sarika Growing Up'],
    media_urls: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&h=600&fit=crop',
    ],
    media_types: ['image', 'image'],
  },
];

const CIRCLES_DATA = [
  {
    name: 'Jaiswal Family',
    description: 'Papa, Mama, Sarika, Dada Ji, Dadi Ma — the core of everything.',
    circle_type: 'family', privacy_setting: 'private',
  },
  {
    name: 'Li Family',
    description: "Ariane's family — Ye Ye, Nai Nai, cousins, and the Chengdu crew.",
    circle_type: 'family', privacy_setting: 'private',
  },
  {
    name: 'Close Friends',
    description: 'The people who knew me before the grey hairs.',
    circle_type: 'friends', privacy_setting: 'private',
  },
];

const CAPSULES_DATA = [
  {
    title: 'To Sarika on Her 18th Birthday',
    description: "A letter from Papa and Mama, sealed until you're ready to read it. We hope the world has been kind to you, and if it hasn't — we hope you were kinder to it.",
    event_date: '2041-02-10',
    invite_link_token: Math.random().toString(36).substring(2, 15),
    contributor_count: 0,
  },
  {
    title: 'Our 10th Anniversary Letter',
    description: "Ariane — ten years of Tuesdays with you. To be opened on our anniversary.",
    event_date: '2026-12-25',
    invite_link_token: Math.random().toString(36).substring(2, 15),
    contributor_count: 0,
  },
  {
    title: 'Family Time Capsule 2025',
    description: 'A snapshot of who we are in 2025 — our routines, our hopes, the songs we play too loud. To be opened in 2035.',
    event_date: '2035-01-01',
    invite_link_token: Math.random().toString(36).substring(2, 15),
    contributor_count: 0,
  },
];

const SEED_KEY = 'lifescribe_seed_ids';

function loadSeedIds() {
  try { return JSON.parse(localStorage.getItem(SEED_KEY) || '{}'); } catch { return {}; }
}
function saveSeedIds(ids) {
  localStorage.setItem(SEED_KEY, JSON.stringify(ids));
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === 'loading') return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SeedPage() {
  const [ashokPassword, setAshokPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState('');
  const [seedIds, setSeedIds] = useState({});

  const [sectionStatus, setSectionStatus] = useState({
    chapters: 'idle', entries: 'idle', circles: 'idle', capsules: 'idle',
  });
  const [familyStatus, setFamilyStatus] = useState(
    Object.fromEntries(FAMILY_MEMBERS.map(m => [m.email, 'idle']))
  );
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signInStatus, setSignInStatus] = useState('idle');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { setSeedIds(loadSeedIds()); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setCurrentUser(u));
    return () => unsub();
  }, []);

  const addLog = (msg) => setLogs(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 80));

  const signInAsAshok = async () => {
    setSignInStatus('loading');
    addLog(`Attempting sign-in as ${ASHOK_EMAIL}…`);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, ASHOK_EMAIL, '123123123');
      setCurrentUser(result.user);
      addLog(`Signed in as ${result.user.email} (${result.user.uid})`);
      setSignInStatus('done');
      setToast('Signed in as Ashok Jaiswal ✓');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        addLog(`Account not found — creating ${ASHOK_EMAIL}…`);
        try {
          const result = await createUserWithEmailAndPassword(auth, ASHOK_EMAIL, '123123123');
          setCurrentUser(result.user);
          await setDoc(doc(db, 'user_profiles', result.user.uid), {
            user_id: result.user.uid,
            full_name: 'Ashok Jaiswal',
            username: 'ashok.jaiswal',
            profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
            current_mood: 'grateful',
            bio: 'Father. Builder. Storyteller.',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });
          addLog(`Account created for ${ASHOK_EMAIL}`);
          setSignInStatus('done');
          setToast('Ashok account created & signed in ✓');
        } catch (createErr) {
          addLog(`Create error: ${createErr.message}`);
          setSignInStatus('error');
          setToast(`Failed: ${createErr.message}`);
        }
      } else {
        addLog(`Sign-in error: ${err.code} — ${err.message}`);
        setSignInStatus('error');
        setToast(`Sign-in failed: ${err.message}`);
      }
    }
  };

  const setSection = (key, status) =>
    setSectionStatus(prev => ({ ...prev, [key]: status }));

  // ── Seed chapters ──────────────────────────────────────────────────────────

  const seedChapters = async () => {
    setSection('chapters', 'loading');
    const ids = loadSeedIds();
    const chapMap = {};
    try {
      for (const ch of CHAPTERS_DATA) {
        const created = await base44.entities.Chapter.create(ch);
        chapMap[ch.name] = created.id;
        ids[`chapter_${created.id}`] = { collection: 'chapters', id: created.id };
        addLog(`Chapter created: "${ch.name}" (${created.id})`);
      }
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setSection('chapters', 'done');
      setToast('Chapters seeded ✓');
      return chapMap;
    } catch (err) {
      addLog(`ERROR chapters: ${err.message}`);
      setSection('chapters', 'error');
      return chapMap;
    }
  };

  // ── Seed entries ───────────────────────────────────────────────────────────

  const seedEntries = async (chapMap) => {
    setSection('entries', 'loading');
    const ids = loadSeedIds();
    // If no chapMap passed, try to reconstruct from stored seeded chapter IDs by fetching their names
    let resolvedMap = chapMap || {};
    if (!chapMap || Object.keys(chapMap).length === 0) {
      try {
        const chapters = await base44.entities.Chapter.list();
        CHAPTERS_DATA.forEach(cd => {
          const match = chapters.find(c => c.name === cd.name);
          if (match) resolvedMap[cd.name] = match.id;
        });
      } catch {}
    }
    const entries = buildEntries(resolvedMap);
    try {
      for (const entry of entries) {
        const created = await base44.entities.JournalEntry.create(entry);
        ids[`entry_${created.id}`] = { collection: 'journal_entries', id: created.id };
        addLog(`Entry created: "${entry.content.slice(0, 40)}…" (${created.id})`);
      }
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setSection('entries', 'done');
      setToast('Journal entries seeded ✓');
    } catch (err) {
      addLog(`ERROR entries: ${err.message}`);
      setSection('entries', 'error');
    }
  };

  // ── Seed circles ───────────────────────────────────────────────────────────

  const seedCircles = async () => {
    setSection('circles', 'loading');
    const ids = loadSeedIds();
    try {
      for (const circle of CIRCLES_DATA) {
        const created = await base44.entities.Circle.create(circle);
        ids[`circle_${created.id}`] = { collection: 'circles', id: created.id };
        addLog(`Circle created: "${circle.name}" (${created.id})`);
      }
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setSection('circles', 'done');
      setToast('Circles seeded ✓');
    } catch (err) {
      addLog(`ERROR circles: ${err.message}`);
      setSection('circles', 'error');
    }
  };

  // ── Seed capsules ──────────────────────────────────────────────────────────

  const seedCapsules = async () => {
    setSection('capsules', 'loading');
    const ids = loadSeedIds();
    try {
      for (const capsule of CAPSULES_DATA) {
        const created = await base44.entities.MomentCapsule.create(capsule);
        ids[`capsule_${created.id}`] = { collection: 'moment_capsules', id: created.id };
        addLog(`Capsule created: "${capsule.title}" (${created.id})`);
      }
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setSection('capsules', 'done');
      setToast('Memory capsules seeded ✓');
    } catch (err) {
      addLog(`ERROR capsules: ${err.message}`);
      setSection('capsules', 'error');
    }
  };

  // ── Seed all (Ashok's data) ────────────────────────────────────────────────

  const seedAll = async () => {
    const chapMap = await seedChapters();
    await seedEntries(chapMap);
    await seedCircles();
    await seedCapsules();
    setToast('All demo data seeded successfully! 🎉');
  };

  // ── Create a single family account ────────────────────────────────────────

  const createFamilyAccount = async (member) => {
    if (!ashokPassword) { setToast('Enter your password first'); return; }
    const ashokEmail = auth.currentUser?.email;
    if (!ashokEmail) { setToast('Not logged in'); return; }

    setFamilyStatus(prev => ({ ...prev, [member.email]: 'loading' }));
    addLog(`Creating account for ${member.name}…`);
    try {
      // Ensure persistence is set
      await setPersistence(auth, browserLocalPersistence);
      
      // Create the Firebase Auth account (signs in as that user)
      const result = await createUserWithEmailAndPassword(auth, member.email, '123123123');
      const newUid = result.user.uid;
      addLog(`Auth account created: ${member.email} (${newUid})`);

      // Write profile directly (we're now signed in as the new user)
      await setDoc(doc(db, 'user_profiles', newUid), {
        user_id: newUid,
        full_name: member.name,
        username: member.username,
        profile_picture_url: member.avatar,
        current_mood: member.mood,
        bio: member.bio,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });
      addLog(`Profile created for ${member.name}`);

      // Sign back in as Ashok
      await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword);
      addLog(`Signed back in as ${ashokEmail}`);

      // Track the profile for potential cleanup
      const ids = loadSeedIds();
      ids[`profile_${newUid}`] = { collection: 'user_profiles', id: newUid };
      saveSeedIds(ids);
      setSeedIds({ ...ids });

      // Send invite email via Resend
      try {
        const inviteLink = `${window.location.origin}/CreateAccount`;
        const resp = await fetch('/api/send-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: member.email,
            inviterName: 'Ashok Jaiswal',
            inviteLink,
            type: 'family',
          }),
        });
        const inviteData = await resp.json();
        if (resp.ok) {
          addLog(`Invite email sent to ${member.email}`);
        } else {
          addLog(`Invite email failed for ${member.email}: ${inviteData?.error}`);
        }
      } catch (inviteErr) {
        addLog(`Invite email error for ${member.email}: ${inviteErr.message}`);
      }

      setFamilyStatus(prev => ({ ...prev, [member.email]: 'done' }));
      setToast(`${member.name} account created + invite sent ✓`);
    } catch (err) {
      addLog(`ERROR ${member.name}: ${err.message}`);
      // Try to sign back in as Ashok even on error
      try { await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword); } catch {}
      setFamilyStatus(prev => ({ ...prev, [member.email]: 'error' }));
      if (err.code === 'auth/email-already-in-use') {
        setFamilyStatus(prev => ({ ...prev, [member.email]: 'done' }));
        setToast(`${member.name} account already exists`);
      } else {
        setToast(`Failed: ${err.message}`);
      }
    }
  };

  const createAllFamilyAccounts = async () => {
    for (const member of FAMILY_MEMBERS) {
      if (familyStatus[member.email] !== 'done') {
        await createFamilyAccount(member);
        await new Promise(r => setTimeout(r, 500));
      }
    }
  };

  // ── Seed connections + family entries ─────────────────────────────────────

  const FAMILY_ENTRIES = {
    'ashokjaiswal+mama@gmail.com': [
      { content: 'Made dumplings with Nai Nai\'s recipe today. Sarika helped fold them — they looked more like clouds than dumplings but she was so proud. The kitchen was a mess and I wouldn\'t change a thing.', mood: 'loving', audience: 'connections', entry_date: '2026-03-15', media_urls: ['https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: 'Sunday morning yoga in the living room while Sarika tried to copy me. She kept falling over and giggling. These are the moments.', mood: 'calm', audience: 'public', entry_date: '2026-03-12' },
      { content: 'Read through old letters from my university days. Found one from Ashok — the most awkward love letter ever written. I\'m keeping it forever.', mood: 'nostalgic', audience: 'private', entry_date: '2026-03-08' },
    ],
    'ashokjaiswal+sarika@gmail.com': [
      { content: 'I drew a picture of our family today! Papa is the tallest, Mama has the prettiest hair, and I am Princess Sarika with a BIG crown.', mood: 'happy', audience: 'connections', entry_date: '2026-03-14', media_urls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: 'We went to the park and I found a ladybug! I named her Spotty. She flew away but I think she\'ll come back tomorrow.', mood: 'happy', audience: 'public', entry_date: '2026-03-10' },
    ],
    'ashokjaiswal+dadima@gmail.com': [
      { content: 'Made chai this morning the way my mother taught me. Three cardamom pods, a pinch of ginger, let it boil twice. Some things never change and that is a blessing.', mood: 'grateful', audience: 'connections', entry_date: '2026-03-13' },
      { content: 'Video call with Sarika. She showed me her drawings and sang a song. That child has so much light in her. Prayed for her health and happiness.', mood: 'loving', audience: 'public', entry_date: '2026-03-09' },
    ],
    'ashokjaiswal+dadaji@gmail.com': [
      { content: 'Walked in the garden today. The tomatoes are coming along nicely. Planted new marigolds near the gate — they remind me of festivals at home when I was young.', mood: 'calm', audience: 'public', entry_date: '2026-03-11', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: 'Ashok called today. He works too hard but he is building something good. Told him about the neem tree — still strong after 40 years.', mood: 'grateful', audience: 'connections', entry_date: '2026-03-07' },
    ],
    'ashokjaiswal+nainae@gmail.com': [
      { content: 'Spring arrived early in Chengdu. The plum blossoms outside the kitchen window are in full bloom. Ye Ye says this means a good harvest. I say it just means it is beautiful.', mood: 'peaceful', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: 'Made tang yuan today and video called Ariane while rolling them. She watched so carefully and wrote down every step. She will be a good cook for this family.', mood: 'loving', audience: 'connections', entry_date: '2026-03-11' },
      { content: 'Sarika called me Nai Nai very clearly today. The first time she said it just right. I had to put the phone down for a moment.', mood: 'loving', audience: 'public', entry_date: '2026-03-06' },
    ],
    'ashokjaiswal+yeye@gmail.com': [
      { content: 'Seven sunflowers came up along the east fence this year. Best count I have had. Planted them in October and nearly forgot about them. The garden always rewards patience.', mood: 'calm', audience: 'public', entry_date: '2026-03-15', media_urls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: 'Morning tea in the garden. The city was waking up. I have done this for forty years and I still do not take it for granted.', mood: 'grateful', audience: 'public', entry_date: '2026-03-10' },
      { content: 'Sarika tried to water my tomatoes over video call by pointing her cup at the screen. The logic was sound. I laughed for a long time.', mood: 'playful', audience: 'connections', entry_date: '2026-03-05' },
    ],
  };

  // Extra public posts seeded via a separate step
  const EXTRA_PUBLIC_POSTS = {
    'ashokjaiswal+mama@gmail.com': [
      { content: "Sarika has started naming every flower in the park. Three tulips today — Maria, Papa, and Cloud. I did not choose these names and I could not be prouder.", mood: 'loving', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1490750967868-88df5691cc4d?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Baked Mama's red bean cake recipe from memory for the first time. It wasn't perfect. Ashok had three pieces anyway. I'll call that a win.", mood: 'happy', audience: 'public', entry_date: '2026-03-18', media_urls: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Teaching Sarika 'xie xie' and 'ni hao'. She now says ni hao to the cat next door. The cat has not replied but Sarika remains optimistic.", mood: 'playful', audience: 'public', entry_date: '2026-03-17' },
      { content: "Video call with Nai Nai and Ye Ye this morning. Sarika showed them her newest drawing for five minutes. They watched every single second. That kind of love is irreplaceable.", mood: 'grateful', audience: 'public', entry_date: '2026-03-14', media_urls: ['https://images.unsplash.com/photo-1577368211130-4bbd0181ddf0?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Found my journal from 2015. The girl in those pages worried so much about things that never happened. I want to go back and tell her to rest more.", mood: 'reflective', audience: 'public', entry_date: '2026-03-09' },
      { content: "Some days feel like everything is balanced perfectly — Sarika happy, the house smells like food, Ashok is home before 9pm. Today was one of those days.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-04' },
      { content: "Cooking with Mama over video call. She's showing me how to make proper dumplings — the way her mother taught her. This is what culture looks like in our kitchen. Sarika on my hip watching, learning without knowing she's learning.", mood: 'loving', sleep_quality: 'well_rested', audience: 'public', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Sarika laughed so hard at the simplest thing today — a bird landing on the fence. That pure, unfiltered joy. This is why we do everything. This moment. This sound. The way she looks at the world with wonder and sees magic in ordinary things.", mood: 'very_happy', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1472162072942-cd5147eb3902?w=800&h=600&fit=crop'], media_types: ['image'] },
    ],
    'ashokjaiswal+sarika@gmail.com': [
      { content: "Today I made COOKIES with Mama and I helped put the chocolate chips in and I only ate like three. Maybe four.", mood: 'happy', audience: 'public', entry_date: '2026-03-19', media_urls: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Papa says I cannot have a puppy but I am going to ask again tomorrow and also the day after that and also the day after that.", mood: 'playful', audience: 'public', entry_date: '2026-03-17' },
      { content: "The moon was SO big last night! I think it was following our car. Papa said that is not how the moon works but I think it was following us.", mood: 'happy', audience: 'public', entry_date: '2026-03-15' },
      { content: "I can say hello to Nai Nai in Chinese all by myself now! She was very happy. I am learning lots of Chinese words.", mood: 'happy', audience: 'public', entry_date: '2026-03-13' },
      { content: "I wore my princess crown to the supermarket today. Some people smiled at me so I smiled back because that is what princesses do.", mood: 'happy', audience: 'public', entry_date: '2026-03-11', media_urls: ['https://images.unsplash.com/photo-1533827432537-1f27b951af4d?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Dadi Ma showed me her kitchen on the phone. She has SO many pots. I want to cook like her when I am big.", mood: 'loving', audience: 'public', entry_date: '2026-03-08' },
      { content: "I found a butterfly in the garden and I watched it for like a hundred hours. Well maybe not a hundred but it was a lot. It was so pretty and it had all the colors.", mood: 'happy', audience: 'public', entry_date: '2026-03-23' },
      { content: "Nai Nai taught me how to say 'I love you' in Chinese today. I told her that I love her SO much. She cried happy tears and gave me extra dumplings. That is how you know it worked.", mood: 'loving', audience: 'public', entry_date: '2026-03-21' },
    ],
    'ashokjaiswal+dadima@gmail.com': [
      { content: "Festivals are coming. Made the first batch of kheer this morning — extra cardamom, the way my mother always did. The whole house smells like memory.", mood: 'grateful', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "My grandmother's hands knew things that no recipe book can ever teach. I am trying to pass what I know to Ariane. She is a willing student.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-18' },
      { content: "Ariane called and asked me to teach her to make aloo paratha over video. Such a good daughter-in-law. We will do it next weekend.", mood: 'loving', audience: 'public', entry_date: '2026-03-16' },
      { content: "The neem tree in the courtyard is flowering. After 40 years in this house I have stopped taking some things for granted. This tree is one of them.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-13', media_urls: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Praying that Sarika grows up with strong roots and wide wings. That is all I ask. Jai Shri Krishna.", mood: 'grateful', audience: 'public', entry_date: '2026-03-10' },
      { content: "Looking at old photographs. Ashok as a small boy — same eyes, same determination, just smaller. Time moves faster than anyone tells you it will.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-05', media_urls: ['https://images.unsplash.com/photo-1416339442236-8ceb164046f8?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Made dal and roti for Sarika over the phone. She was so proud of eating 'Dadi Ma's cooking'. Ashok tells me she ate the whole bowl. The old recipes are the bridge between generations. They carry love in every spice.", mood: 'loving', sleep_quality: 'well_rested', audience: 'public', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Morning prayers in the temple before sunrise. The quietness, the stillness, the presence of something greater than my worries. After all these years it still brings me peace. This is the tradition I pray my children will keep.", mood: 'peaceful', sleep_quality: 'rested', audience: 'public', entry_date: '2026-03-19' },
    ],
    'ashokjaiswal+dadaji@gmail.com': [
      { content: "Walked three kilometres before breakfast. The park was quiet. Just the birds and one old man with his dog. I think we understood each other.", mood: 'calm', audience: 'public', entry_date: '2026-03-19' },
      { content: "Sarika said 'Dada Ji' on video very clearly today. First time she got it exactly right. My heart did something I am not sure I can properly describe.", mood: 'loving', audience: 'public', entry_date: '2026-03-17' },
      { content: "The monsoon tomatoes always taste different from the summer ones — sweeter somehow. This year's crop was the best in a decade. Sent some with Ashok when he visited.", mood: 'grateful', audience: 'public', entry_date: '2026-03-14', media_urls: ['https://images.unsplash.com/photo-1546094096-0df4bcaad337?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Wrote a letter to Sarika to be given to her on her eighteenth birthday. Sealed it. Gave it to Dadi Ma for safekeeping. She is a better keeper of important things than I am.", mood: 'reflective', audience: 'public', entry_date: '2026-03-12' },
      { content: "Retired, yes. Finished, no. Working on the memoir. One page at a time. The problem is that every page leads to three more stories.", mood: 'motivated', audience: 'public', entry_date: '2026-03-09' },
      { content: "India won the test. Good day. Quiet evening. Chai with Dadi Ma on the veranda. Some days are just simply good.", mood: 'happy', audience: 'public', entry_date: '2026-03-03' },
      { content: "Planted new seeds in the garden today. Ashok came with Sarika last week and pointed at an empty patch. Now there will be something growing there. That is what life is about — planting seeds you may not see bloom.", mood: 'peaceful', sleep_quality: 'rested', audience: 'public', entry_date: '2026-03-23', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Watching the sunrise with a cup of strong chai. Thought about how a man spends his life learning and still ends up with more questions than answers. But somehow that is comfort enough.", mood: 'calm', sleep_quality: 'well_rested', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop'], media_types: ['image'] },
    ],
    'ashokjaiswal+nainae@gmail.com': [
      { content: "Made dumplings for the neighbours today. Community is the first thing that disappears when people get too busy. I refuse to let it disappear from our lane.", mood: 'loving', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "The garden is waking up. Cucumbers along the south wall, bitter melon climbing the fence, green onions in every gap. Ye Ye keeps adding things. The man has no restraint in a garden.", mood: 'playful', audience: 'public', entry_date: '2026-03-19', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Looking at photos of Ariane when she was Sarika's age. The resemblance is strong. Both stubborn. Both beautiful. Both impossible to say no to.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-15' },
      { content: "The Dragon Boat Festival is coming. Started soaking the glutinous rice already. Ariane asked for the recipe again — this time I wrote it down properly for her.", mood: 'happy', audience: 'public', entry_date: '2026-03-12', media_urls: ['https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Some nights the moonrise over the garden is so beautiful I just stand there. Ye Ye comes to find me and stands there too. We do not talk. We just watch.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-07' },
      { content: "Made the tang yuan today. Ashok used to ask for them every time we visited. Now Sarika will grow up with them too. The recipes that carry a family forward.", mood: 'loving', audience: 'public', entry_date: '2026-03-02', media_urls: ['https://images.unsplash.com/photo-1625938144755-652e08e359b7?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Sarika and I baked together today — she stood on the stool and mixed the flour. Got more on her than in the bowl. Ye Ye laughed so hard he had to sit down. This is why we keep living. For these moments.", mood: 'happy', sleep_quality: 'rested', audience: 'public', entry_date: '2026-03-24', media_urls: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Watering the vegetables early this morning before anyone wakes up. The tomatoes are almost ready. Ye Ye and I will have fresh dal with fresh tomatoes for lunch. Small things. The best things. A life spent together is a blessing I do not take for granted.", mood: 'grateful', sleep_quality: 'great', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop'], media_types: ['image'] },
    ],
    'ashokjaiswal+yeye@gmail.com': [
      { content: "Morning tea in the garden while the city wakes up. I have done this for forty years. I will do it forty more if heaven allows. There is no better way to start a day.", mood: 'grateful', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "A man is only as rich as his garden and his stories. I am working very hard to be a rich man.", mood: 'reflective', audience: 'public', entry_date: '2026-03-18' },
      { content: "The fish were not biting today. But it was a beautiful morning to not catch fish. The river was very still. I sat there for two hours. Went home full somehow.", mood: 'calm', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1500522144261-ea64433bbe27?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Sarika tried to water my tomatoes over video call by pointing her little cup at the screen. The logic was completely sound. I could not argue with it.", mood: 'playful', audience: 'public', entry_date: '2026-03-14' },
      { content: "Wrote down all the family recipes in a proper notebook today. Nai Nai says I measured everything wrong. She is probably right. But I have been cooking them correctly for forty years.", mood: 'happy', audience: 'public', entry_date: '2026-03-11' },
      { content: "Tomatoes, sunflowers, bitter melon, long beans, spring onions. The east garden is full. I told Nai Nai I would stop planting things. I did not stop planting things.", mood: 'playful', audience: 'public', entry_date: '2026-03-06', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Fishing at dawn by the river. The silence there teaches you things books cannot. Everything is slower when the world is asleep. Everything is clearer. Nai Nai called — she knew where to find me. We sat together as the sun came up.", mood: 'peaceful', sleep_quality: 'great', audience: 'public', entry_date: '2026-03-25', media_urls: ['https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=800&h=600&fit=crop'], media_types: ['image'] },
      { content: "Ashok visited with Sarika. She ran through the garden naming things — banana tree, flower, Dada's rock. She is building her own map of the world we have made. That is enough. That is everything.", mood: 'loving', sleep_quality: 'well_rested', audience: 'public', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=600&fit=crop'], media_types: ['image'] },
    ],
  };

  const ASHOK_PUBLIC_ENTRIES = [
    { content: "Every startup pivot sounds crazy until it doesn't. We shipped two features quietly this week. The product is getting more real every day. Grateful for the team.", mood: 'motivated', sleep_quality: 'good', motivation: 'very_high', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning call with Dad. He asked if I was eating properly. I said yes. I lied. He probably knew. Some conversations don't need truth — just presence.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-19' },
    { content: "Sarika discovered the word 'why' today and has been asking it nonstop for six hours. Why is the sky blue. Why do we have toes. Why does water get wet. I have no answers but I love every question.", mood: 'playful', audience: 'public', entry_date: '2026-03-17' },
    { content: "Ten years ago I had exactly two things: a laptop and a belief that something could be built. I still have both. Added a family along the way.", mood: 'reflective', motivation: 'high', audience: 'public', entry_date: '2026-03-15' },
    { content: "Family dinner. Dadi Ma's dal on the stove, Sarika banging a spoon on the table, Ariane explaining something important over all the noise. This is the noise I'll miss most someday.", mood: 'loving', sleep_quality: 'great', audience: 'public', entry_date: '2026-03-13', media_urls: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Good sleep is underrated. Slept 8 hours for the first time in a month. I feel like a completely different person. Today I remembered I have a body.", mood: 'calm', sleep_quality: 'great', motivation: 'high', audience: 'public', entry_date: '2026-03-11' },
    { content: "Spent the weekend experimenting with new recipes. Made a dal with fennel and fenugreek that reminded me of Dadi Ma's cooking. Ariane approved. Sarika actually ate a full bowl. Small victories taste the sweetest.", mood: 'happy', sleep_quality: 'well_rested', motivation: 'high', audience: 'public', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika reading with Ariane before bedtime. The way she sits on her mother's lap, asking about every word, curious about everything. I sat there watching them. This is what I build for. This is what matters.", mood: 'loving', sleep_quality: 'energised', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Started running again after months of excuses. Five kilometers this morning with the sun coming up. Felt alive for the first time in weeks. Sore now but it's the good kind of sore.", mood: 'energised', sleep_quality: 'great', motivation: 'very_motivated', audience: 'public', entry_date: '2026-03-18', media_urls: ['https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sunset from the office window today was unexpected beauty. Stopped everything for fifteen minutes just to watch the sky change colors. Ariane always says I miss the small things. Not today. Not anymore.", mood: 'peaceful', sleep_quality: 'rested', audience: 'public', entry_date: '2026-03-16' },
    { content: "Downloaded a guitar app. Lesson one was harder than I expected. Fingers hurt. Don't remember why I thought learning music at thirty-five was a good idea. But I will try again tomorrow. Small goals, big dreams.", mood: 'motivated', sleep_quality: 'good', motivation: 'motivated', audience: 'public', entry_date: '2026-03-14', media_urls: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning coffee alone before everyone wakes up. Grateful for Ariane and Sarika. Grateful for Dad and the whole family. Grateful that I get to wake up tomorrow and do this all again. Today was good. Today, everything feels possible.", mood: 'grateful', sleep_quality: 'great', motivation: 'very_high', audience: 'public', entry_date: '2026-03-12', media_urls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'], media_types: ['image'] },
  ];

  const [connStatus, setConnStatus] = useState('idle');
  const [extraPostsStatus, setExtraPostsStatus] = useState('idle');
  const [ashokPublicStatus, setAshokPublicStatus] = useState('idle');

  const seedConnectionsAndEntries = async () => {
    if (!ashokPassword) { setToast('Enter your password first'); return; }
    const ashokEmail = auth.currentUser?.email || ASHOK_EMAIL;
    const ashokUid = auth.currentUser?.uid;
    if (!ashokUid) { setToast('Not logged in as Ashok'); return; }

    setConnStatus('loading');
    const ids = loadSeedIds();

    try {
      await setPersistence(auth, browserLocalPersistence);

      for (const member of FAMILY_MEMBERS) {
        addLog(`Processing ${member.name}…`);

        // Sign in as the family member
        let memberUid;
        try {
          const res = await signInWithEmailAndPassword(auth, member.email, '123123123');
          memberUid = res.user.uid;
          addLog(`Signed in as ${member.name} (${memberUid})`);
        } catch (err) {
          addLog(`SKIP ${member.name}: can't sign in — ${err.message}`);
          continue;
        }

        // Create entries for this family member
        const memberEntries = FAMILY_ENTRIES[member.email] || [];
        for (const entry of memberEntries) {
          try {
            const ref = await addDoc(collection(db, 'journal_entries'), {
              ...entry,
              user_id: memberUid,
              username: member.username,
              created_date: new Date(entry.entry_date).toISOString(),
              updated_date: new Date().toISOString(),
            });
            ids[`fam_entry_${ref.id}`] = { collection: 'journal_entries', id: ref.id };
            addLog(`Entry created for ${member.name}: "${entry.content.slice(0, 30)}…"`);
          } catch (err) {
            addLog(`Entry error for ${member.name}: ${err.message}`);
          }
        }

        // Create connection: member → Ashok
        try {
          const ref = await addDoc(collection(db, 'connections'), {
            user_id: memberUid,
            connected_user_id: ashokUid,
            connected_user_name: 'Ashok Jaiswal',
            connected_user_avatar: '',
            username: 'ashok.jaiswal',
            relationship_label: member.role === 'Mama' ? 'Husband' : member.role === 'Daughter' ? 'Father' : 'Family',
            status: 'accepted',
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          });
          ids[`conn_${ref.id}`] = { collection: 'connections', id: ref.id };
          addLog(`Connection ${member.name} → Ashok created`);
        } catch (err) {
          addLog(`Connection error: ${err.message}`);
        }

        // Sign back in as Ashok
        await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword);

        // Create connection: Ashok → member
        try {
          const ref = await addDoc(collection(db, 'connections'), {
            user_id: ashokUid,
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
          ids[`conn_${ref.id}`] = { collection: 'connections', id: ref.id };
          addLog(`Connection Ashok → ${member.name} created`);
        } catch (err) {
          addLog(`Connection error: ${err.message}`);
        }

        await new Promise(r => setTimeout(r, 300));
      }

      // Ensure we end signed in as Ashok
      await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword);
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setConnStatus('done');
      setToast('Connections & family entries seeded! 🎉');
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      try { await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword); } catch {}
      setConnStatus('error');
      setToast(`Failed: ${err.message}`);
    }
  };

  // ── Seed Ashok's public posts (no auth switch needed) ───────────────────────

  const seedAshokPublicEntries = async () => {
    const ashokUid = auth.currentUser?.uid;
    if (!ashokUid) { setToast('Sign in as Ashok first'); return; }
    setAshokPublicStatus('loading');
    const ids = loadSeedIds();
    try {
      for (const entry of ASHOK_PUBLIC_ENTRIES) {
        const ref = await addDoc(collection(db, 'journal_entries'), {
          ...entry,
          user_id: ashokUid,
          username: 'ashok.jaiswal',
          created_date: new Date(entry.entry_date).toISOString(),
          updated_date: new Date().toISOString(),
        });
        ids[`pub_entry_${ref.id}`] = { collection: 'journal_entries', id: ref.id };
        addLog(`Ashok public entry: "${entry.content.slice(0, 40)}…"`);
      }
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setAshokPublicStatus('done');
      setToast('Ashok public posts seeded ✓');
    } catch (err) {
      addLog(`ERROR Ashok public: ${err.message}`);
      setAshokPublicStatus('error');
    }
  };

  // ── Seed extra public posts for all family members ───────────────────────────

  const seedExtraPublicPosts = async () => {
    if (!ashokPassword) { setToast('Enter your password first'); return; }
    const ashokEmail = auth.currentUser?.email || ASHOK_EMAIL;
    const ashokUid = auth.currentUser?.uid;
    if (!ashokUid) { setToast('Not logged in as Ashok'); return; }

    setExtraPostsStatus('loading');
    const ids = loadSeedIds();

    try {
      await setPersistence(auth, browserLocalPersistence);

      for (const member of FAMILY_MEMBERS) {
        const memberExtraPosts = EXTRA_PUBLIC_POSTS[member.email];
        if (!memberExtraPosts?.length) continue;
        addLog(`Seeding extra public posts for ${member.name}…`);

        let memberUid;
        try {
          const res = await signInWithEmailAndPassword(auth, member.email, '123123123');
          memberUid = res.user.uid;
        } catch (err) {
          addLog(`SKIP ${member.name}: can't sign in — ${err.message}`);
          continue;
        }

        for (const entry of memberExtraPosts) {
          try {
            const ref = await addDoc(collection(db, 'journal_entries'), {
              ...entry,
              user_id: memberUid,
              username: member.username,
              created_date: new Date(entry.entry_date).toISOString(),
              updated_date: new Date().toISOString(),
            });
            ids[`extra_${ref.id}`] = { collection: 'journal_entries', id: ref.id };
            addLog(`  Public post: "${entry.content.slice(0, 40)}…"`);
          } catch (err) {
            addLog(`  Entry error: ${err.message}`);
          }
        }

        await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword);
        await new Promise(r => setTimeout(r, 300));
      }

      await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword);
      saveSeedIds(ids);
      setSeedIds({ ...ids });
      setExtraPostsStatus('done');
      setToast('Extra public posts seeded for all family members! 🎉');
    } catch (err) {
      addLog(`ERROR extra posts: ${err.message}`);
      try { await signInWithEmailAndPassword(auth, ashokEmail, ashokPassword); } catch {}
      setExtraPostsStatus('error');
      setToast(`Failed: ${err.message}`);
    }
  };

  // ── Clear all seed data ────────────────────────────────────────────────────

  const clearSeedData = async () => {
    if (!window.confirm('Delete all seeded demo data? This cannot be undone.')) return;
    setDeleting(true);
    const ids = loadSeedIds();
    const entries = Object.values(ids);
    addLog(`Deleting ${entries.length} seeded records…`);
    let deleted = 0;
    for (const { collection: col, id } of entries) {
      try {
        await deleteDoc(doc(db, col, id));
        deleted++;
        addLog(`Deleted ${col}/${id}`);
      } catch (err) {
        addLog(`SKIP ${col}/${id}: ${err.message}`);
      }
    }
    localStorage.removeItem(SEED_KEY);
    setSeedIds({});
    setSectionStatus({ chapters: 'idle', entries: 'idle', circles: 'idle', capsules: 'idle' });
    setFamilyStatus(Object.fromEntries(FAMILY_MEMBERS.map(m => [m.email, 'idle'])));
    setToast(`Deleted ${deleted} records ✓`);
    setDeleting(false);
  };

  const seededCount = Object.keys(seedIds).length;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-[#111111]">Demo Seed</h1>
            {seededCount > 0 && (
              <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">
                {seededCount} records seeded
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Main: <span className="font-mono text-gray-600">ashokjaiswal@gmail.com</span> — Run sections in order below.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Step 0: Sign in / Create Ashok account ── */}
        <div className={`rounded-2xl p-5 border ${
          currentUser?.email === ASHOK_EMAIL
            ? 'bg-green-50 border-green-100'
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-[#111111]">Step 0 — Ashok's Account</p>
            {currentUser && <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">{currentUser.email}</span>}
          </div>
          <p className="text-xs text-gray-400 mb-3">Signs in (or creates) <span className="font-mono">ashokjaiswal@gmail.com</span> with password <span className="font-mono">123123123</span>. Must be Ashok before seeding.</p>
          <Button
            onClick={signInAsAshok}
            disabled={signInStatus === 'loading' || currentUser?.email === ASHOK_EMAIL}
            className={`w-full rounded-full h-10 font-semibold flex items-center gap-2 justify-center ${
              currentUser?.email === ASHOK_EMAIL
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-[#111111] text-white hover:bg-[#333]'
            } disabled:opacity-40`}
          >
            <StatusBadge status={currentUser?.email === ASHOK_EMAIL ? 'done' : signInStatus} />
            {currentUser?.email === ASHOK_EMAIL
              ? 'Signed in as Ashok ✓'
              : signInStatus === 'loading' ? 'Signing in…' : 'Sign In / Create Ashok Account'}
          </Button>
        </div>

        {/* ── Seed All Button ── */}
        <div className="bg-[#111111] rounded-2xl p-5">
          <p className="text-white font-semibold mb-1">Seed All Demo Data</p>
          <p className="text-gray-400 text-xs mb-4">Creates 5 chapters, 10 journal entries, 3 circles, 3 memory capsules under your account.</p>
          <Button
            onClick={seedAll}
            className="w-full bg-white text-[#111111] hover:bg-gray-100 rounded-full h-10 font-semibold flex items-center gap-2 justify-center"
            disabled={Object.values(sectionStatus).every(s => s === 'done')}
          >
            <Play className="w-4 h-4" />
            {Object.values(sectionStatus).every(s => s === 'done') ? 'All Seeded ✓' : 'Seed All'}
          </Button>
        </div>

        {/* ── Individual Sections ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#111111]">Individual Sections</p>
          </div>
          {[
            { key: 'chapters', label: 'Chapters (5)', icon: BookOpen, action: seedChapters },
            { key: 'entries', label: 'Journal Entries (10)', icon: BookOpen, action: () => seedEntries(null) },
            { key: 'circles', label: 'Circles (3)', icon: Users, action: seedCircles },
            { key: 'capsules', label: 'Memory Capsules (3)', icon: Archive, action: seedCapsules },
          ].map(({ key, label, icon: Icon, action }, i) => (
            <div key={key} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className="flex items-center gap-3">
                <StatusBadge status={sectionStatus[key]} />
                <span className="text-sm text-[#111111]">{label}</span>
              </div>
              <button
                onClick={action}
                disabled={sectionStatus[key] === 'loading' || sectionStatus[key] === 'done'}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F5F5F5] text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                {sectionStatus[key] === 'done' ? 'Done' : sectionStatus[key] === 'loading' ? 'Running…' : 'Seed'}
              </button>
            </div>
          ))}
        </div>

        {/* ── Family Accounts ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#111111]">Family Accounts</p>
            <p className="text-xs text-gray-400 mt-0.5">Creates Firebase Auth accounts + profiles. Password for all: <code className="bg-gray-100 px-1 rounded">123123123</code></p>
          </div>

          {/* Password input */}
          <div className="px-4 py-3 border-b border-gray-50 bg-amber-50/50">
            <p className="text-xs text-amber-700 font-medium mb-2">Enter YOUR password to restore your session after each account is created</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={ashokPassword}
                  onChange={e => setAshokPassword(e.target.value)}
                  placeholder="Ashok's password (123123123)"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none pr-9"
                />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-2 top-2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={createAllFamilyAccounts}
                disabled={!ashokPassword}
                className="text-xs px-3 py-2 rounded-lg bg-[#111111] text-white font-medium disabled:opacity-40 whitespace-nowrap"
              >
                Create All
              </button>
            </div>
          </div>

          {/* Family member rows */}
          {FAMILY_MEMBERS.map((m, i) => (
            <div key={m.email} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <StatusBadge status={familyStatus[m.email]} />
              <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#111111] truncate">{m.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
              </div>
              <button
                onClick={() => createFamilyAccount(m)}
                disabled={!ashokPassword || familyStatus[m.email] === 'loading' || familyStatus[m.email] === 'done'}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F5F5F5] text-gray-600 font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {familyStatus[m.email] === 'done' ? 'Done' : familyStatus[m.email] === 'loading' ? '…' : 'Create'}
              </button>
            </div>
          ))}
        </div>

        {/* ── Seed Connections & Entries ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#111111]">Seed Connections & Family Entries</p>
            <p className="text-xs text-gray-400 mt-0.5">Creates bi-directional connections between Ashok and each family member, plus journal entries (public/connections/private) for each family account to test feed visibility.</p>
          </div>
          <div className="px-4 py-3">
            <Button
              onClick={seedConnectionsAndEntries}
              disabled={connStatus === 'loading' || connStatus === 'done' || !ashokPassword}
              className="w-full bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-10 font-semibold flex items-center gap-2 justify-center disabled:opacity-40"
            >
              <StatusBadge status={connStatus} />
              {connStatus === 'done' ? 'Connections & Entries Seeded ✓' : connStatus === 'loading' ? 'Seeding connections…' : 'Seed Connections & Family Entries'}
            </Button>
            {!ashokPassword && connStatus === 'idle' && (
              <p className="text-xs text-amber-600 mt-2 text-center">Enter your password in the Family Accounts section above first</p>
            )}
          </div>
        </div>

        {/* ── Seed Ashok Public Posts ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#111111]">Seed Ashok's Public Posts (12)</p>
            <p className="text-xs text-gray-400 mt-0.5">Creates 6 public journal entries under Ashok's handle. Run while signed in as Ashok — no password needed.</p>
          </div>
          <div className="px-4 py-3">
            <Button
              onClick={seedAshokPublicEntries}
              disabled={ashokPublicStatus === 'loading' || ashokPublicStatus === 'done' || !currentUser}
              className="w-full bg-[#1A1A2E] text-white hover:bg-[#2a2a4e] rounded-full h-10 font-semibold flex items-center gap-2 justify-center disabled:opacity-40"
            >
              <StatusBadge status={ashokPublicStatus} />
              {ashokPublicStatus === 'done' ? 'Ashok Posts Seeded ✓' : ashokPublicStatus === 'loading' ? 'Seeding…' : 'Seed Ashok Public Posts'}
            </Button>
          </div>
        </div>

        {/* ── Extra Public Posts for All Family Members ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-[#111111]">Seed Extra Public Posts — All Family (8 each)</p>
            <p className="text-xs text-gray-400 mt-0.5">Seeds 6 rich public posts for Ariane, Sarika, Dadi Ma, Dada Ji, Nai Nai, and Ye Ye. These appear on their public handles. Requires family accounts to exist first.</p>
          </div>
          <div className="px-4 py-3">
            <Button
              onClick={seedExtraPublicPosts}
              disabled={extraPostsStatus === 'loading' || extraPostsStatus === 'done' || !ashokPassword}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 rounded-full h-10 font-semibold flex items-center gap-2 justify-center disabled:opacity-40"
            >
              <StatusBadge status={extraPostsStatus} />
              {extraPostsStatus === 'done' ? 'All Family Posts Seeded ✓' : extraPostsStatus === 'loading' ? 'Seeding all members…' : 'Seed 36 Public Posts (6 per member)'}
            </Button>
            {!ashokPassword && extraPostsStatus === 'idle' && (
              <p className="text-xs text-amber-600 mt-2 text-center">Enter your password in the Family Accounts section above first</p>
            )}
          </div>
        </div>

        {/* ── Credentials Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-[#111111]">Demo Login Credentials</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: 'Ashok Jaiswal (you)', email: auth.currentUser?.email || ASHOK_EMAIL, role: 'Papa', pwd: '123123123' },
              ...FAMILY_MEMBERS.map(m => ({ name: m.name, email: m.email, role: m.role })),
            ].map(cred => (
              <div key={cred.email} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-[#111111]">{cred.name} <span className="text-gray-400 font-normal">· {cred.role}</span></p>
                  <p className="text-[10px] text-gray-400 font-mono">{cred.email}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(cred.email); setToast('Email copied'); }}
                  className="text-gray-300 hover:text-gray-500"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">Password for all family accounts: <span className="font-mono font-semibold">123123123</span></p>
          </div>
        </div>

        {/* ── Activity Log ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setShowLogs(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <p className="text-sm font-semibold text-[#111111]">Activity Log ({logs.length})</p>
            {showLogs ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showLogs && (
            <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-0.5">
              {logs.length === 0 && <p className="text-xs text-gray-300">No activity yet.</p>}
              {logs.map((l, i) => (
                <p key={i} className="text-[10px] font-mono text-gray-500 leading-relaxed">{l}</p>
              ))}
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        {seededCount > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">Danger Zone</p>
            <p className="text-xs text-red-500 mb-3">This will delete all {seededCount} seeded records from Firestore. Cannot be undone.</p>
            <button
              onClick={clearSeedData}
              disabled={deleting}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {deleting ? 'Deleting…' : `Delete All Seed Data (${seededCount})`}
            </button>
          </div>
        )}
      </div>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}
