#!/usr/bin/env node
/**
 * LifeScribe Seed Script
 *
 * Usage:
 *   node scripts/seed.mjs              # seed everything
 *   node scripts/seed.mjs --skip-photos # skip photo downloads (use Unsplash URLs)
 *   node scripts/seed.mjs --verify      # only run verification checks
 *
 * Requirements: pnpm add -D dotenv (already in .env.local)
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ─────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnv();

// ─── Firebase init ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const PASSWORD = '123123123';
const ASHOK_EMAIL = 'ashokjaiswal@gmail.com';
const SKIP_PHOTOS = process.argv.includes('--skip-photos');
const VERIFY_ONLY = process.argv.includes('--verify');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function log(emoji, msg) { console.log(`${emoji}  ${msg}`); }
function success(msg) { log('✅', msg); }
function info(msg) { log('📋', msg); }
function warn(msg) { log('⚠️', msg); }
function err(msg) { log('❌', msg); }

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function signInOrCreate(email, password, profileData) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (e) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
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
    throw e;
  }
}

async function downloadAndUploadPhoto(url, storagePath) {
  if (SKIP_PHOTOS) return url;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return url;
    const buffer = Buffer.from(await resp.arrayBuffer());
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, buffer, { contentType: 'image/jpeg' });
    return await getDownloadURL(storageRef);
  } catch (e) {
    warn(`Photo download failed for ${storagePath}: ${e.message} — using URL`);
    return url;
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const ASHOK_PROFILE = {
  full_name: 'Ashok Jaiswal',
  username: 'ashok.jaiswal',
  profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  current_mood: 'grateful',
  bio: 'Father. Builder. Storyteller.',
};

const FAMILY = [
  { name: 'Ariane Li', email: 'ashokjaiswal+mama@gmail.com', username: 'ariane.li', role: 'Mama', mood: 'loving', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', bio: 'Living life with love and gratitude.' },
  { name: 'Sarika Jaiswal', email: 'ashokjaiswal+sarika@gmail.com', username: 'sarika.jaiswal', role: 'Daughter', mood: 'happy', avatar: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop', bio: 'Princess Sarika. Age 3.' },
  { name: 'Dadi Ma', email: 'ashokjaiswal+dadima@gmail.com', username: 'dadi.ma', role: 'Paternal Grandmom', mood: 'grateful', avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop', bio: 'Nani ke haath ka khana sabse achha.' },
  { name: 'Dada Ji', email: 'ashokjaiswal+dadaji@gmail.com', username: 'dada.ji', role: 'Paternal Granddad', mood: 'calm', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop', bio: 'Old trees give the best shade.' },
  { name: 'Nai Nai Li', email: 'ashokjaiswal+nainae@gmail.com', username: 'nainai.li', role: 'Maternal Grandmom', mood: 'peaceful', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop', bio: 'Chengdu garden keeper.' },
  { name: 'Ye Ye Li', email: 'ashokjaiswal+yeye@gmail.com', username: 'yeye.li', role: 'Maternal Granddad', mood: 'grateful', avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&fit=crop', bio: 'Sunflowers and tomatoes and good tea.' },
];

const CHAPTERS = [
  { name: 'Family & Home', description: 'Our home life, family dinners, everyday moments.', date_from: '2020-01-01', privacy: 'circles', cover_image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=400&fit=crop' },
  { name: 'Adventures & Travel', description: 'Exploring the world — every trip, every discovery.', date_from: '2018-01-01', privacy: 'circles', cover_image_url: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=400&fit=crop' },
  { name: 'Sarika Growing Up', description: 'Every milestone, every laugh, every tiny moment.', date_from: '2020-06-01', privacy: 'private', cover_image_url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=400&fit=crop' },
];

const CIRCLES = [
  { name: 'Jaiswal Family', description: 'Papa, Mama, Sarika, Dada Ji, Dadi Ma.', circle_type: 'family', privacy_setting: 'private' },
  { name: 'Li Family', description: "Ariane's family — Ye Ye, Nai Nai, and the Chengdu crew.", circle_type: 'family', privacy_setting: 'private' },
  { name: 'Close Friends', description: 'The people who knew me before the grey hairs.', circle_type: 'friends', privacy_setting: 'private' },
];

const CAPSULES = [
  { title: 'To Sarika on Her 18th Birthday', description: "A letter from Papa and Mama, sealed until you're ready to read it.", event_date: '2041-02-10', invite_link_token: Math.random().toString(36).substring(2, 15) },
  { title: 'Our 10th Anniversary Letter', description: "Ariane — ten years of Tuesdays with you.", event_date: '2026-12-25', invite_link_token: Math.random().toString(36).substring(2, 15) },
  { title: 'Family Time Capsule 2025', description: 'A snapshot of who we are in 2025 — our routines, our hopes.', event_date: '2035-01-01', invite_link_token: Math.random().toString(36).substring(2, 15) },
];

// All entries for all users
const ENTRIES = {
  [ASHOK_EMAIL]: [
    { content: "Woke up early today and sat with a cup of tea watching the sunrise from the balcony. Sarika was still asleep. Ariane was reading. These quiet mornings are everything. I've been thinking about how fast time moves — she was just a baby and now she's running around pretending to be a chef.", mood: 'grateful', sleep_quality: 'great', motivation: 'high', audience: 'private', entry_date: '2026-03-22', media_urls: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Family dinner tonight. Dadi Ma made her famous dal makhani and we all sat around the table together. Dada Ji kept telling old stories from his village days — about the rains, about the mango trees.", mood: 'loving', sleep_quality: 'good', audience: 'connections', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Bali. Day 3. The rice paddies in Ubud are exactly as beautiful as every photo promised. We rented a scooter and got completely lost — ended up at a small warung where the owner insisted we stay for lunch.", mood: 'energised', motivation: 'high', audience: 'connections', entry_date: '2026-03-18', media_urls: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop', 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800&h=600&fit=crop'], media_types: ['image', 'image'] },
    { content: "Sarika said 'I love you Papa' completely unprompted tonight while I was putting her to bed. Just out of nowhere. I didn't say anything back for a moment — just held her. Some moments you want to live inside forever.", mood: 'loving', audience: 'private', entry_date: '2026-03-16' },
    { content: "Every startup pivot sounds crazy until it doesn't. We shipped two features quietly this week. The product is getting more real every day. Grateful for the team.", mood: 'motivated', sleep_quality: 'good', motivation: 'very_high', audience: 'public', entry_date: '2026-03-14', media_urls: ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika discovered the word 'why' today and has been asking it nonstop for six hours. Why is the sky blue. Why do we have toes. Why does water get wet. I have no answers but I love every question.", mood: 'playful', audience: 'public', entry_date: '2026-03-12' },
    { content: "Ten years ago I had exactly two things: a laptop and a belief that something could be built. I still have both. Added a family along the way.", mood: 'reflective', motivation: 'high', audience: 'public', entry_date: '2026-03-10' },
    { content: "Family dinner. Dadi Ma's dal on the stove, Sarika banging a spoon on the table, Ariane explaining something important over all the noise. This is the noise I'll miss most someday.", mood: 'loving', sleep_quality: 'great', audience: 'public', entry_date: '2026-03-08', media_urls: ['https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning call with Dad. He asked if I was eating properly. I said yes. I lied. He probably knew. Some conversations don't need truth — just presence.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-06' },
    { content: "Good sleep is underrated. Slept 8 hours for the first time in a month. I feel like a completely different person. Today I remembered I have a body.", mood: 'calm', sleep_quality: 'great', motivation: 'high', audience: 'public', entry_date: '2026-03-04' },
    { content: "Tried making biryani from scratch. Three hours, one YouTube tutorial, two phone calls to Dadi Ma. The rice was perfect. The chicken was questionable. Sarika ate it so I'm calling it a win.", mood: 'playful', audience: 'public', entry_date: '2026-03-02', media_urls: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Started running again after months. Did 3k before my lungs reminded me I'm not 22 anymore. But the sunrise over the park was worth every wheeze.", mood: 'energised', motivation: 'motivated', audience: 'public', entry_date: '2026-02-28', media_urls: ['https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+mama@gmail.com': [
    { content: "Sarika has started naming every flower in the park. Three tulips today — Maria, Papa, and Cloud. I did not choose these names and I could not be prouder.", mood: 'loving', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1490750967868-88df5691cc4d?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sunday morning yoga in the living room while Sarika tried to copy me. She kept falling over and giggling. These are the moments.", mood: 'calm', audience: 'public', entry_date: '2026-03-19' },
    { content: "Teaching Sarika 'xie xie' and 'ni hao'. She now says ni hao to the cat next door. The cat has not replied but Sarika remains optimistic.", mood: 'playful', audience: 'public', entry_date: '2026-03-17' },
    { content: "Video call with Nai Nai and Ye Ye this morning. Sarika showed them her newest drawing for five minutes. They watched every single second. That kind of love is irreplaceable.", mood: 'grateful', audience: 'public', entry_date: '2026-03-15', media_urls: ['https://images.unsplash.com/photo-1577368211130-4bbd0181ddf0?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Found my journal from 2015. The girl in those pages worried so much about things that never happened. I want to go back and tell her to rest more.", mood: 'reflective', audience: 'public', entry_date: '2026-03-13' },
    { content: "Read through old letters from my university days. Found one from Ashok — the most awkward love letter ever written. I'm keeping it forever.", mood: 'nostalgic', audience: 'connections', entry_date: '2026-03-11' },
    { content: "Baked Mama's red bean cake recipe from memory for the first time. It wasn't perfect. Ashok had three pieces anyway.", mood: 'happy', audience: 'public', entry_date: '2026-03-09', media_urls: ['https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Some days feel like everything is balanced perfectly — Sarika happy, the house smells like food, Ashok is home before 9pm. Today was one of those days.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-07' },
  ],
  'ashokjaiswal+sarika@gmail.com': [
    { content: "I drew a picture of our family today! Papa is the tallest, Mama has the prettiest hair, and I am Princess Sarika with a BIG crown.", mood: 'happy', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "We went to the park and I found a ladybug! I named her Spotty. She flew away but I think she'll come back tomorrow.", mood: 'happy', audience: 'public', entry_date: '2026-03-18' },
    { content: "Today I made COOKIES with Mama and I helped put the chocolate chips in and I only ate like three. Maybe four.", mood: 'happy', audience: 'public', entry_date: '2026-03-16', media_urls: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Papa says I cannot have a puppy but I am going to ask again tomorrow and also the day after that and also the day after that.", mood: 'playful', audience: 'public', entry_date: '2026-03-14' },
    { content: "The moon was SO big last night! I think it was following our car. Papa said that is not how the moon works but I think it was following us.", mood: 'happy', audience: 'public', entry_date: '2026-03-12' },
    { content: "I wore my princess crown to the supermarket today. Some people smiled at me so I smiled back because that is what princesses do.", mood: 'happy', audience: 'public', entry_date: '2026-03-10', media_urls: ['https://images.unsplash.com/photo-1533827432537-1f27b951af4d?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+dadima@gmail.com': [
    { content: "Made chai this morning the way my mother taught me. Three cardamom pods, a pinch of ginger, let it boil twice. Some things never change and that is a blessing.", mood: 'grateful', audience: 'public', entry_date: '2026-03-21' },
    { content: "Video call with Sarika. She showed me her drawings and sang a song. That child has so much light in her. Prayed for her health and happiness.", mood: 'loving', audience: 'public', entry_date: '2026-03-19' },
    { content: "Festivals are coming. Made the first batch of kheer this morning — extra cardamom, the way my mother always did. The whole house smells like memory.", mood: 'grateful', audience: 'public', entry_date: '2026-03-17', media_urls: ['https://images.unsplash.com/photo-1559703248-dcaaec9fab78?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "The neem tree in the courtyard is flowering. After 40 years in this house I have stopped taking some things for granted. This tree is one of them.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-15', media_urls: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Looking at old photographs. Ashok as a small boy — same eyes, same determination, just smaller. Time moves faster than anyone tells you it will.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-13', media_urls: ['https://images.unsplash.com/photo-1416339442236-8ceb164046f8?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+dadaji@gmail.com': [
    { content: "Walked in the garden today. The tomatoes are coming along nicely. Planted new marigolds near the gate — they remind me of festivals at home.", mood: 'calm', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Walked three kilometres before breakfast. The park was quiet. Just the birds and one old man with his dog. I think we understood each other.", mood: 'calm', audience: 'public', entry_date: '2026-03-18' },
    { content: "Sarika said 'Dada Ji' on video very clearly today. First time she got it exactly right. My heart did something I cannot properly describe.", mood: 'loving', audience: 'public', entry_date: '2026-03-16' },
    { content: "Wrote a letter to Sarika to be given to her on her eighteenth birthday. Sealed it. Gave it to Dadi Ma for safekeeping.", mood: 'reflective', audience: 'public', entry_date: '2026-03-14' },
    { content: "India won the test. Good day. Quiet evening. Chai with Dadi Ma on the veranda. Some days are just simply good.", mood: 'happy', audience: 'public', entry_date: '2026-03-12' },
  ],
  'ashokjaiswal+nainae@gmail.com': [
    { content: "Spring arrived early in Chengdu. The plum blossoms outside the kitchen window are in full bloom. Ye Ye says this means a good harvest. I say it just means it is beautiful.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-21', media_urls: ['https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Made dumplings for the neighbours today. Community is the first thing that disappears when people get too busy. I refuse to let it disappear.", mood: 'loving', audience: 'public', entry_date: '2026-03-19', media_urls: ['https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika called me Nai Nai very clearly today. The first time she said it just right. I had to put the phone down for a moment.", mood: 'loving', audience: 'public', entry_date: '2026-03-17' },
    { content: "Looking at photos of Ariane when she was Sarika's age. The resemblance is strong. Both stubborn. Both beautiful. Both impossible to say no to.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-15' },
    { content: "Some nights the moonrise over the garden is so beautiful I just stand there. Ye Ye comes to find me and stands there too. We do not talk. We just watch.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-13' },
  ],
  'ashokjaiswal+yeye@gmail.com': [
    { content: "Seven sunflowers came up along the east fence this year. Best count I have had. Planted them in October and nearly forgot about them. The garden always rewards patience.", mood: 'calm', audience: 'public', entry_date: '2026-03-20', media_urls: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning tea in the garden while the city wakes up. I have done this for forty years and I still do not take it for granted.", mood: 'grateful', audience: 'public', entry_date: '2026-03-18' },
    { content: "Sarika tried to water my tomatoes over video call by pointing her cup at the screen. The logic was completely sound. I could not argue with it.", mood: 'playful', audience: 'public', entry_date: '2026-03-16' },
    { content: "A man is only as rich as his garden and his stories. I am working very hard to be a rich man.", mood: 'reflective', audience: 'public', entry_date: '2026-03-14' },
    { content: "The fish were not biting today. But it was a beautiful morning to not catch fish. The river was very still.", mood: 'calm', audience: 'public', entry_date: '2026-03-12', media_urls: ['https://images.unsplash.com/photo-1500522144261-ea64433bbe27?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌱 LifeScribe Seed Script\n');
  info(`Firebase project: ${firebaseConfig.projectId}`);
  info(`Skip photos: ${SKIP_PHOTOS}`);
  info(`Verify only: ${VERIFY_ONLY}\n`);

  const uids = {};
  let totalEntries = 0;
  let totalConnections = 0;

  // ── Step 1: Create/Sign-in Ashok ──────────────────────────────────────────
  info('Step 1: Sign in / create Ashok account');
  try {
    const ashok = await signInOrCreate(ASHOK_EMAIL, PASSWORD, ASHOK_PROFILE);
    uids[ASHOK_EMAIL] = ashok.uid;
    success(`Ashok: ${ashok.uid} (${ashok.email})`);
  } catch (e) {
    err(`Failed to sign in as Ashok: ${e.message}`);
    process.exit(1);
  }

  if (VERIFY_ONLY) {
    await runVerification(uids);
    process.exit(0);
  }

  // ── Step 2: Download & upload Ashok's avatar ──────────────────────────────
  if (!SKIP_PHOTOS) {
    info('Step 2: Upload Ashok profile photo');
    try {
      const photoUrl = await downloadAndUploadPhoto(
        ASHOK_PROFILE.profile_picture_url,
        `avatars/${uids[ASHOK_EMAIL]}/profile.jpg`
      );
      await setDoc(doc(db, 'user_profiles', uids[ASHOK_EMAIL]), {
        profile_picture_url: photoUrl,
        updated_date: new Date().toISOString(),
      }, { merge: true });
      success('Ashok avatar uploaded to Storage');
    } catch (e) {
      warn(`Avatar upload: ${e.message}`);
    }
  } else {
    info('Step 2: Skipping photo downloads');
  }

  // ── Step 3: Create family accounts ────────────────────────────────────────
  info('\nStep 3: Create family accounts');
  for (const member of FAMILY) {
    try {
      const user = await signInOrCreate(member.email, PASSWORD, {
        full_name: member.name,
        username: member.username,
        profile_picture_url: member.avatar,
        current_mood: member.mood,
        bio: member.bio,
      });
      uids[member.email] = user.uid;

      // Upload avatar
      if (!SKIP_PHOTOS) {
        try {
          const photoUrl = await downloadAndUploadPhoto(member.avatar, `avatars/${user.uid}/profile.jpg`);
          await setDoc(doc(db, 'user_profiles', user.uid), { profile_picture_url: photoUrl, updated_date: new Date().toISOString() }, { merge: true });
        } catch {}
      }

      // Sign back as Ashok
      await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
      success(`${member.name} (${member.role}): ${user.uid}`);
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        // Account exists, sign in to get UID
        try {
          const user = await signInWithEmailAndPassword(auth, member.email, PASSWORD);
          uids[member.email] = user.user.uid;
          await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
          success(`${member.name} (exists): ${user.user.uid}`);
        } catch (e2) {
          err(`${member.name}: ${e2.message}`);
          try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
        }
      } else {
        err(`${member.name}: ${e.message}`);
        try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
      }
    }
    await sleep(300);
  }

  // ── Step 4: Create bi-directional connections ─────────────────────────────
  info('\nStep 4: Create bi-directional connections');
  for (const member of FAMILY) {
    const memberUid = uids[member.email];
    if (!memberUid) { warn(`Skipping connection for ${member.name} — no UID`); continue; }

    try {
      // Ashok → member
      await addDoc(collection(db, 'connections'), {
        user_id: uids[ASHOK_EMAIL],
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
        connected_user_id: uids[ASHOK_EMAIL],
        connected_user_name: 'Ashok Jaiswal',
        connected_user_avatar: ASHOK_PROFILE.profile_picture_url,
        username: 'ashok.jaiswal',
        relationship_label: member.role === 'Mama' ? 'Husband' : member.role === 'Daughter' ? 'Father' : 'Family',
        status: 'accepted',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });

      await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
      totalConnections += 2;
      success(`${member.name} ↔ Ashok connected`);
    } catch (e) {
      err(`Connection ${member.name}: ${e.message}`);
      try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}
    }
    await sleep(200);
  }

  // ── Step 5: Seed chapters ─────────────────────────────────────────────────
  info('\nStep 5: Seed chapters');
  const chapterIds = {};
  for (const ch of CHAPTERS) {
    try {
      let coverUrl = ch.cover_image_url;
      if (!SKIP_PHOTOS) {
        coverUrl = await downloadAndUploadPhoto(ch.cover_image_url, `chapters/${uids[ASHOK_EMAIL]}/${ch.name.replace(/\s/g, '_')}.jpg`);
      }
      const ref = await addDoc(collection(db, 'chapters'), {
        ...ch,
        cover_image_url: coverUrl,
        user_id: uids[ASHOK_EMAIL],
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });
      chapterIds[ch.name] = ref.id;
      success(`Chapter: ${ch.name}`);
    } catch (e) {
      err(`Chapter ${ch.name}: ${e.message}`);
    }
  }

  // ── Step 6: Seed circles ──────────────────────────────────────────────────
  info('\nStep 6: Seed circles');
  for (const circle of CIRCLES) {
    try {
      await addDoc(collection(db, 'circles'), {
        ...circle,
        user_id: uids[ASHOK_EMAIL],
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });
      success(`Circle: ${circle.name}`);
    } catch (e) {
      err(`Circle ${circle.name}: ${e.message}`);
    }
  }

  // ── Step 7: Seed capsules ─────────────────────────────────────────────────
  info('\nStep 7: Seed capsules');
  for (const cap of CAPSULES) {
    try {
      await addDoc(collection(db, 'moment_capsules'), {
        ...cap,
        is_open: true,
        contributor_count: 0,
        user_id: uids[ASHOK_EMAIL],
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      });
      success(`Capsule: ${cap.title}`);
    } catch (e) {
      err(`Capsule ${cap.title}: ${e.message}`);
    }
  }

  // ── Step 8: Seed journal entries for ALL users ────────────────────────────
  info('\nStep 8: Seed journal entries');
  for (const [email, entries] of Object.entries(ENTRIES)) {
    const uid = uids[email];
    if (!uid) { warn(`Skipping entries for ${email} — no UID`); continue; }

    // Sign in as this user
    await signInWithEmailAndPassword(auth, email, PASSWORD);
    const member = FAMILY.find(m => m.email === email);
    const username = member ? member.username : 'ashok.jaiswal';

    for (const entry of entries) {
      try {
        // Optionally upload entry photos
        let mediaUrls = entry.media_urls || [];
        if (!SKIP_PHOTOS && mediaUrls.length > 0) {
          const uploaded = [];
          for (let i = 0; i < mediaUrls.length; i++) {
            const url = await downloadAndUploadPhoto(
              mediaUrls[i],
              `entries/${uid}/${entry.entry_date}_${i}.jpg`
            );
            uploaded.push(url);
          }
          mediaUrls = uploaded;
        }

        await addDoc(collection(db, 'journal_entries'), {
          ...entry,
          media_urls: mediaUrls,
          user_id: uid,
          username,
          is_deleted: false,
          chapter_id: email === ASHOK_EMAIL ? (chapterIds['Family & Home'] || null) : null,
          created_date: new Date(entry.entry_date).toISOString(),
          updated_date: new Date().toISOString(),
        });
        totalEntries++;
      } catch (e) {
        err(`Entry for ${email}: ${e.message}`);
      }
    }
    info(`  ${username}: ${entries.length} entries`);
  }

  // Sign back as Ashok
  await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  success(`Seeding complete!`);
  info(`Accounts: ${Object.keys(uids).length}`);
  info(`Connections: ${totalConnections}`);
  info(`Chapters: ${Object.keys(chapterIds).length}`);
  info(`Circles: ${CIRCLES.length}`);
  info(`Capsules: ${CAPSULES.length}`);
  info(`Entries: ${totalEntries}`);
  console.log('─'.repeat(50));

  // ── Run verification ──────────────────────────────────────────────────────
  await runVerification(uids);

  process.exit(0);
}

async function runVerification(uids) {
  console.log('\n🔍 Running verification checks...\n');
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      const result = await fn();
      if (result) { success(`${name}`); passed++; }
      else { err(`${name}`); failed++; }
    } catch (e) {
      err(`${name}: ${e.message}`); failed++;
    }
  }

  // Make sure we're signed in as Ashok
  try { await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD); } catch {}

  await check('Ashok profile exists', async () => {
    const snap = await getDocs(query(collection(db, 'user_profiles'), where('username', '==', 'ashok.jaiswal'), limit(1)));
    return !snap.empty;
  });

  await check('Ashok has connections', async () => {
    const snap = await getDocs(query(collection(db, 'connections'), where('user_id', '==', auth.currentUser.uid), limit(1)));
    return !snap.empty;
  });

  await check('Public entries exist', async () => {
    const snap = await getDocs(query(collection(db, 'journal_entries'), where('audience', '==', 'public'), limit(5)));
    return snap.docs.length >= 5;
  });

  await check('All family handles resolve', async () => {
    for (const handle of ['ariane.li', 'sarika.jaiswal', 'dadi.ma', 'dada.ji', 'nainai.li', 'yeye.li']) {
      const snap = await getDocs(query(collection(db, 'user_profiles'), where('username', '==', handle), limit(1)));
      if (snap.empty) return false;
    }
    return true;
  });

  await check('Family members can sign in', async () => {
    for (const member of FAMILY) {
      try {
        await signInWithEmailAndPassword(auth, member.email, PASSWORD);
      } catch { return false; }
    }
    await signInWithEmailAndPassword(auth, ASHOK_EMAIL, PASSWORD);
    return true;
  });

  await check('Chapters exist', async () => {
    const snap = await getDocs(query(collection(db, 'chapters'), where('user_id', '==', auth.currentUser.uid), limit(1)));
    return !snap.empty;
  });

  await check('Circles exist', async () => {
    const snap = await getDocs(query(collection(db, 'circles'), where('user_id', '==', auth.currentUser.uid), limit(1)));
    return !snap.empty;
  });

  await check('Capsules exist', async () => {
    const snap = await getDocs(query(collection(db, 'moment_capsules'), where('user_id', '==', auth.currentUser.uid), limit(1)));
    return !snap.empty;
  });

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`${'─'.repeat(50)}\n`);
}

main().catch(e => { err(e.message); process.exit(1); });
