'use client';
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import {
  CheckCircle2, Circle, Loader2, AlertCircle, Trash2,
  Play, Users, BookOpen, Archive, Lock, Eye, EyeOff, Copy, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Toast from '@/components/lifescribe/Toast';

// ─── Seed data ────────────────────────────────────────────────────────────────

const FAMILY_MEMBERS = [
  {
    name: 'Ariane Li', role: 'Mama', email: 'ashok.jaiswal+ariane@gmail.com',
    username: 'ariane.li',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    mood: 'loving', bio: 'Living life with love and gratitude.',
  },
  {
    name: 'Sarika Jaiswal', role: 'Daughter', email: 'ashok.jaiswal+sarika@gmail.com',
    username: 'sarika.jaiswal',
    avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
    mood: 'happy', bio: 'Princess Sarika. Age 3.',
  },
  {
    name: 'Dadi Ma', role: 'Paternal Grandmom', email: 'ashok.jaiswal+dadima@gmail.com',
    username: 'dadi.ma',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop',
    mood: 'grateful', bio: 'Nani ke haath ka khana sabse achha.',
  },
  {
    name: 'Dada Ji', role: 'Paternal Granddad', email: 'ashok.jaiswal+dadaji@gmail.com',
    username: 'dada.ji',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    mood: 'calm', bio: 'Old trees give the best shade.',
  },
  {
    name: 'Nai Nai Li', role: 'Maternal Grandmom', email: 'ashok.jaiswal+nainae@gmail.com',
    username: 'nainai.li',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop',
    mood: 'peaceful', bio: 'Chengdu garden keeper.',
  },
  {
    name: 'Ye Ye Li', role: 'Maternal Granddad', email: 'ashok.jaiswal+yeye@gmail.com',
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

  useEffect(() => { setSeedIds(loadSeedIds()); }, []);

  const addLog = (msg) => setLogs(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 80));

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

      setFamilyStatus(prev => ({ ...prev, [member.email]: 'done' }));
      setToast(`${member.name} account created ✓`);
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
          <p className="text-xs text-gray-400">Creates demo data for Ashok Jaiswal's account. Run once per account.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

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
                  placeholder="Your account password"
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

        {/* ── Credentials Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" />
            <p className="text-sm font-semibold text-[#111111]">Demo Login Credentials</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { name: 'Ashok Jaiswal (you)', email: auth.currentUser?.email || 'ashok.jaiswal@gmail.com', role: 'Papa' },
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
