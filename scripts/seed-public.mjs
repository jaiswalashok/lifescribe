#!/usr/bin/env node
/**
 * Updates all existing entries to public and seeds additional content.
 * Usage: node scripts/seed-public.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
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

const PASSWORD = '123123123';
const ASHOK_EMAIL = 'ashokjaiswal@gmail.com';

async function signIn(email) {
  const result = await signInWithEmailAndPassword(auth, email, PASSWORD);
  return result.user;
}

const ALL_EMAILS = [
  'ashokjaiswal@gmail.com',
  'ashokjaiswal+mama@gmail.com',
  'ashokjaiswal+sarika@gmail.com',
  'ashokjaiswal+dadima@gmail.com',
  'ashokjaiswal+dadaji@gmail.com',
  'ashokjaiswal+nainae@gmail.com',
  'ashokjaiswal+yeye@gmail.com',
];

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Make ALL existing non-public entries → public
// Sign in as each user to satisfy Firestore security rules
// ═══════════════════════════════════════════════════════════════════════════════
async function makeAllEntriesPublic() {
  console.log('\n📋  Step 1: Making all existing entries public...');
  let totalUpdated = 0;

  for (const email of ALL_EMAILS) {
    const user = await signIn(email);
    // Get only this user's non-public entries
    const snap = await getDocs(query(
      collection(db, 'journal_entries'),
      where('user_id', '==', user.uid)
    ));
    let updated = 0;
    for (const d of snap.docs) {
      if (d.data().audience !== 'public') {
        await updateDoc(doc(db, 'journal_entries', d.id), { audience: 'public' });
        updated++;
      }
    }
    if (updated > 0) {
      console.log(`  ✅  ${email}: ${updated} entries → public`);
    }
    totalUpdated += updated;
  }
  console.log(`✅  Updated ${totalUpdated} entries to public`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Seed additional content for all users
// ═══════════════════════════════════════════════════════════════════════════════

const EXTRA_ENTRIES = {
  'ashokjaiswal@gmail.com': [
    { content: "Built a treehouse today with some scrap wood from the garage. Sarika supervised from below, giving very detailed instructions. She's already a better project manager than most people I've worked with.", mood: 'happy', audience: 'public', entry_date: '2026-03-28', media_urls: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Quiet Saturday morning. Everyone still asleep. Made pour-over coffee and sat on the porch watching the neighborhood wake up. A stray cat came and sat next to me for ten minutes. We shared the silence.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-27' },
    { content: "Ariane surprised me with handmade noodles tonight. She learned from Nai Nai over video call last week and didn't tell me. The noodles were thick and imperfect and absolutely incredible.", mood: 'loving', audience: 'public', entry_date: '2026-03-26', media_urls: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Product launch went live at 2am. Watched the first user sign up at 2:07am. Felt like watching a baby take its first steps — except this baby is a SaaS product and it definitely has bugs.", mood: 'motivated', audience: 'public', entry_date: '2026-03-25' },
    { content: "Took Sarika to the aquarium today. She pressed her face against the glass and said 'Papa, the fish are dreaming.' I don't know what that means but I wrote it down because it's the most beautiful thing I've ever heard.", mood: 'loving', audience: 'public', entry_date: '2026-03-24', media_urls: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Ran 5k this morning without stopping. Six months ago I couldn't do 1k. Progress isn't always visible day to day but when you zoom out it's unmistakable.", mood: 'energised', motivation: 'very_high', audience: 'public', entry_date: '2026-03-23', media_urls: ['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Dada Ji called to tell me about his tomato plants. Talked for 40 minutes. Not once did he ask about work. Just tomatoes, weather, and whether I'd eaten lunch. That man understands priorities.", mood: 'grateful', audience: 'public', entry_date: '2026-03-22' },
    { content: "Family movie night. Sarika picked Moana for the ninth time. Ariane fell asleep twenty minutes in. I watched both of them more than the movie.", mood: 'loving', audience: 'public', entry_date: '2026-04-01', media_urls: ['https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "April already. This year is moving too fast. But I look at Sarika and she's taller. I look at the product and it's better. I look at us and we're stronger. Fast isn't always bad.", mood: 'reflective', audience: 'public', entry_date: '2026-04-02' },
    { content: "Cooked breakfast for the whole family this morning. Eggs, toast, chai. Dadi Ma would say my chai is too weak. She'd be right. But everyone drank it.", mood: 'happy', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+mama@gmail.com': [
    { content: "Woke up early and painted while the house was quiet. Just watercolors and a cup of jasmine tea. I haven't done this in months. My hands remembered even when my brain forgot.", mood: 'calm', audience: 'public', entry_date: '2026-03-28', media_urls: ['https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Sarika asked me to teach her a Chinese lullaby tonight. I sang the one Nai Nai used to sing me. Halfway through I forgot the words but Sarika didn't notice because she was already asleep.", mood: 'loving', audience: 'public', entry_date: '2026-03-27' },
    { content: "Date night with Ashok. We went to that Italian place downtown and talked about everything except work and parenting for two whole hours. It felt like being 25 again.", mood: 'happy', audience: 'public', entry_date: '2026-03-26' },
    { content: "Planted herbs on the windowsill — basil, mint, coriander. Sarika has been appointed Head of Watering. She takes the job extremely seriously.", mood: 'playful', audience: 'public', entry_date: '2026-03-25', media_urls: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Video call with Mama today. She showed me the plum blossoms in the garden. For a moment I missed home so much it ached. Then Sarika climbed into my lap and the ache turned into something gentler.", mood: 'nostalgic', audience: 'public', entry_date: '2026-03-24' },
    { content: "Made mooncakes from scratch today. The filling was too sweet and the shape was uneven, but Sarika said they were 'the most beautiful cakes in the world.' She's my favourite food critic.", mood: 'happy', audience: 'public', entry_date: '2026-04-01', media_urls: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Morning run in the park. Cherry blossoms are out. I ran slower just to look at them longer. Some days the world is so beautiful it feels deliberate.", mood: 'peaceful', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1522383225653-ed111181a951?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+sarika@gmail.com': [
    { content: "Today at school we learned about DINOSAURS and my favourite one is the triceratops because it has THREE horns and that is more horns than anyone needs but I still love it.", mood: 'happy', audience: 'public', entry_date: '2026-03-28' },
    { content: "I made a card for Mama with glitter and stickers and a drawing of our family. Papa said the glitter got everywhere but Mama put it on the fridge so I think she liked it.", mood: 'happy', audience: 'public', entry_date: '2026-03-26', media_urls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Papa and I built a FORT in the living room with all the pillows and blankets. Mama said we could keep it up for ONE day. It has been three days. Nobody has said anything.", mood: 'playful', audience: 'public', entry_date: '2026-03-24' },
    { content: "I learned to write my full name today! S-A-R-I-K-A J-A-I-S-W-A-L. That is a LOT of letters. My friend Tom only has seven letters total. Life is not fair.", mood: 'happy', audience: 'public', entry_date: '2026-04-01' },
    { content: "We went to the farmers market and I got to pick the vegetables. I picked corn because it is yellow and broccoli because it looks like tiny trees. I did NOT pick the brussels sprouts.", mood: 'playful', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+dadima@gmail.com': [
    { content: "Morning puja was especially peaceful today. Lit the diya, said my prayers. Asked for health for everyone. The smoke curled up slowly — felt like the prayer was being carried.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-28' },
    { content: "Taught the neighbour's daughter how to make roti today. Her first few were shaped like clouds — not round at all. I told her mine looked the same when I was learning. I was lying. Mine were worse.", mood: 'playful', audience: 'public', entry_date: '2026-03-26' },
    { content: "Sarika called today and sang me a song she learned at school. She forgot half the words but sang louder on the parts she remembered. That girl has confidence. She gets it from our side.", mood: 'loving', audience: 'public', entry_date: '2026-03-24' },
    { content: "Made mango pickle today. The whole house smells of mustard seeds and rai. Dada Ji came in and said 'smells like your mother's kitchen.' Best compliment I have ever received.", mood: 'grateful', audience: 'public', entry_date: '2026-04-01', media_urls: ['https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Read old letters this evening. Found one Ashok wrote when he was twelve — asking permission to stay at a friend's house. So formal, so serious. He was always an old soul in a young body.", mood: 'nostalgic', audience: 'public', entry_date: '2026-04-03' },
  ],
  'ashokjaiswal+dadaji@gmail.com': [
    { content: "The jasmine near the back wall has bloomed. Forty years of patience with that plant. It blooms when it wants, not when you want. Most things in life are like that.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-28', media_urls: ['https://images.unsplash.com/photo-1490750967868-88df5691cc4d?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Read the newspaper front to back. Called my brother. Played chess online. Lost twice. Won once. Had dal chawal for dinner. A perfectly ordinary day. I am learning that ordinary days are the best ones.", mood: 'calm', audience: 'public', entry_date: '2026-03-26' },
    { content: "Ashok sent photos of Sarika at the park. She was on the swing, mid-air, laughing. I set it as my phone wallpaper. Dadi Ma says I look at my phone too much now. She is correct.", mood: 'loving', audience: 'public', entry_date: '2026-03-24' },
    { content: "Fixed the garden gate hinge that has been squeaking for six months. Tools out, twenty minutes, done. Dadi Ma asked why it took so long. I said I was waiting for the right moment. She did not believe me.", mood: 'playful', audience: 'public', entry_date: '2026-04-01' },
    { content: "Evening walk along the river. Saw three kingfishers. Stood still for ten minutes watching them dive. The world gives you small spectacles every day if you have the patience to stop and watch.", mood: 'peaceful', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+nainae@gmail.com': [
    { content: "Spent the morning at the market choosing the freshest fish. The vendor knows me by name now. After twenty years in this neighbourhood I am finally a local.", mood: 'happy', audience: 'public', entry_date: '2026-03-28' },
    { content: "Started teaching myself calligraphy again. My grandmother was a master. My strokes are clumsy but there is something in the muscle memory that feels like her guiding my hand.", mood: 'reflective', audience: 'public', entry_date: '2026-03-26', media_urls: ['https://images.unsplash.com/photo-1455885661740-29cbf08a42fa?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Ye Ye and I sat in the garden this afternoon and listened to an old radio programme. Neither of us said a word for an hour. After fifty years together, silence is its own conversation.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-24' },
    { content: "Ariane sent a video of Sarika trying to use chopsticks. She was holding them like a sword. The determination in her face — that is her mother through and through.", mood: 'loving', audience: 'public', entry_date: '2026-04-01' },
    { content: "Made tea eggs this morning — the recipe my mother taught me. The marbling came out perfectly. Some recipes carry more than flavour. They carry people.", mood: 'grateful', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
  'ashokjaiswal+yeye@gmail.com': [
    { content: "Planted a peach tree sapling today. I will probably not see it fully grown. That is not the point. The point is that someone will sit under it someday and eat a peach and be grateful.", mood: 'reflective', audience: 'public', entry_date: '2026-03-28', media_urls: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&h=600&fit=crop'], media_types: ['image'] },
    { content: "Built a small wooden stool for Sarika. Carved her name on the bottom. When she visits next summer she will have her own seat at the table. A man needs something to look forward to.", mood: 'loving', audience: 'public', entry_date: '2026-03-26' },
    { content: "Heavy rain all day. Sat by the window watching the garden drink. Nai Nai made hot ginger soup. The rain sounds different when you are warm and dry and loved.", mood: 'peaceful', audience: 'public', entry_date: '2026-03-24' },
    { content: "Found my father's old fishing rod in the shed. The handle is worn smooth from his hands. I took it to the river and caught nothing. But I held what he held and that was enough.", mood: 'nostalgic', audience: 'public', entry_date: '2026-04-01' },
    { content: "The sunflowers are taller than the fence now. Nai Nai says the garden looks like a painting. I say it looks like stubbornness rewarded. Same thing, I suppose.", mood: 'happy', audience: 'public', entry_date: '2026-04-03', media_urls: ['https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&h=600&fit=crop'], media_types: ['image'] },
  ],
};

async function seedExtraEntries() {
  console.log('\n📋  Step 2: Seeding additional entries for all accounts...');
  let totalNew = 0;

  for (const [email, entries] of Object.entries(EXTRA_ENTRIES)) {
    // Sign in as this user
    const user = await signIn(email);

    // Get their username from profile
    const profileSnap = await getDocs(query(collection(db, 'user_profiles'), where('user_id', '==', user.uid)));
    const username = profileSnap.docs[0]?.data()?.username || email.split('@')[0];

    for (const entry of entries) {
      await addDoc(collection(db, 'journal_entries'), {
        ...entry,
        user_id: user.uid,
        username,
        is_deleted: false,
        created_date: new Date(entry.entry_date + 'T12:00:00Z').toISOString(),
        updated_date: new Date().toISOString(),
      });
      totalNew++;
    }
    console.log(`✅  ${username}: ${entries.length} new entries`);
  }
  console.log(`\n✅  Seeded ${totalNew} new public entries across all accounts`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Verify
// ═══════════════════════════════════════════════════════════════════════════════
async function verify() {
  console.log('\n🔍  Verifying public entries per user...');

  // Sign back in as Ashok
  await signIn(ASHOK_EMAIL);

  const allEntries = await getDocs(collection(db, 'journal_entries'));
  const publicEntries = allEntries.docs.filter(d => d.data().audience === 'public' && !d.data().is_deleted);

  // Count per user
  const perUser = {};
  for (const d of publicEntries) {
    const uid = d.data().user_id;
    const username = d.data().username || uid;
    perUser[username] = (perUser[username] || 0) + 1;
  }

  console.log('──────────────────────────────────────────────────');
  for (const [username, count] of Object.entries(perUser).sort((a, b) => b[1] - a[1])) {
    console.log(`  @${username}: ${count} public entries`);
  }
  console.log('──────────────────────────────────────────────────');
  console.log(`  Total public entries: ${publicEntries.length}`);
  console.log('──────────────────────────────────────────────────');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('🌱 LifeScribe Public Content Seeder');
  console.log(`📋  Firebase project: ${firebaseConfig.projectId}`);

  await makeAllEntriesPublic();
  await seedExtraEntries();
  await verify();

  console.log('\n✅  Done! All handles should now show public content.');
  process.exit(0);
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });
