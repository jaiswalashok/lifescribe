'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import MoodRingAvatar from '@/components/lifescribe/MoodRingAvatar';
import VoiceInput from '@/components/lifescribe/VoiceInput';
import { Camera, Video, Mic, X, ImagePlus, Play, Pause, Lock, Globe, Users, ChevronLeft, Send, StopCircle, CircleDot } from 'lucide-react';

const AUDIENCE_OPTS = [
  { value: 'public', icon: Globe, label: 'Public' },
  { value: 'connections', icon: Users, label: 'Inner Circle' },
  { value: 'private', icon: Lock, label: 'Only Me' },
];

// ─── MediaRecorder helper ────────────────────────────────────────────────────
function useMediaRecorder({ onStop }) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const start = async (constraints) => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    recorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    recorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorderRef.current.mimeType });
      onStop(blob, recorderRef.current.mimeType);
      stream.getTracks().forEach(t => t.stop());
    };
    recorderRef.current.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return { start, stop, recording };
}

// ─── Composer ────────────────────────────────────────────────────────────────
function PostComposer({ currentUser, profile, onPosted }) {
  const [text, setText] = useState('');
  const [mediaItems, setMediaItems] = useState([]); // [{blob|file, previewUrl, type:'image'|'video'|'audio'}]
  const [audience, setAudience] = useState('public');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState(null); // null | 'video' | 'audio'
  const videoRef = useRef();
  const fileInputRef = useRef();

  const audioRecorder = useMediaRecorder({
    onStop: (blob) => {
      setMediaItems(prev => [...prev, { blob, previewUrl: URL.createObjectURL(blob), type: 'audio' }]);
      setMode(null);
    },
  });

  const videoRecorder = useMediaRecorder({
    onStop: (blob) => {
      setMediaItems(prev => [...prev, { blob, previewUrl: URL.createObjectURL(blob), type: 'video' }]);
      setMode(null);
    },
  });

  const startVideoPreview = async () => {
    setMode('video');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  };

  const startRecordVideo = () => videoRecorder.start({ video: true, audio: true });
  const stopRecordVideo = () => {
    videoRecorder.stop();
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
  };

  const startRecordAudio = () => { setMode('audio'); audioRecorder.start({ audio: true }); };
  const stopRecordAudio = () => audioRecorder.stop();

  const handleFilePick = (e) => {
    Array.from(e.target.files || []).forEach(file => {
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
      setMediaItems(prev => [...prev, { file, previewUrl: URL.createObjectURL(file), type }]);
    });
    e.target.value = '';
  };

  const removeMedia = (i) => setMediaItems(prev => prev.filter((_, idx) => idx !== i));

  const handlePost = async () => {
    if (!text.trim() && mediaItems.length === 0) return;
    setSaving(true);
    const uploaded_urls = [];
    const uploaded_types = [];
    for (const item of mediaItems) {
      const blob = item.blob || item.file;
      const ext = item.type === 'audio' ? 'webm' : item.type === 'video' ? 'webm' : 'jpg';
      const sRef = storageRef(storage, `feed/${currentUser.uid}/${Date.now()}.${ext}`);
      await uploadBytes(sRef, blob);
      uploaded_urls.push(await getDownloadURL(sRef));
      uploaded_types.push(item.type);
    }
    await addDoc(collection(db, 'journal_entries'), {
      user_id: currentUser.uid,
      username: profile?.username || '',
      content: text.trim() || '',
      media_urls: uploaded_urls,
      media_types: uploaded_types,
      audience,
      is_deleted: false,
      entry_date: new Date().toISOString().split('T')[0],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });
    setText('');
    setMediaItems([]);
    setSaving(false);
    onPosted?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
      <div className="flex items-start gap-3 mb-3">
        <MoodRingAvatar src={profile?.profile_picture_url} mood={profile?.current_mood} size={36} name={profile?.full_name} />
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full bg-[#F5F5F5] rounded-xl px-3 py-2.5 text-sm text-[#111111] placeholder:text-gray-300 border-0 outline-none resize-none"
          />
          <div className="absolute bottom-2 right-2">
            <VoiceInput onTranscript={(t) => setText(prev => prev ? prev + ' ' + t : t)} />
          </div>
        </div>
      </div>

      {/* Media previews */}
      {mediaItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {mediaItems.map((item, i) => (
            <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
              {item.type === 'image' && <img src={item.previewUrl} className="w-24 h-24 object-cover" alt="" />}
              {item.type === 'video' && <video src={item.previewUrl} className="w-24 h-24 object-cover" />}
              {item.type === 'audio' && (
                <div className="w-32 h-12 flex items-center justify-center">
                  <audio src={item.previewUrl} controls className="w-full scale-75" />
                </div>
              )}
              <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video recorder preview */}
      {mode === 'video' && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-black aspect-video">
          <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3">
            {!videoRecorder.recording ? (
              <button onClick={startRecordVideo} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <CircleDot className="w-6 h-6 text-white" />
              </button>
            ) : (
              <button onClick={stopRecordVideo} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <StopCircle className="w-6 h-6 text-red-500" />
              </button>
            )}
            <button onClick={() => { setMode(null); if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); }}
              className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Audio recorder */}
      {mode === 'audio' && (
        <div className="flex items-center gap-3 mb-3 bg-[#F5F5F5] rounded-xl p-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 flex-1">Recording audio…</span>
          <button onClick={stopRecordAudio} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
            <StopCircle className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={handleFilePick} />
          <button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Add photo/video/audio">
            <ImagePlus className="w-4.5 h-4.5" />
          </button>
          <button onClick={startVideoPreview} disabled={mode !== null} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40" title="Record video">
            <Video className="w-4 h-4" />
          </button>
          <button onClick={startRecordAudio} disabled={mode !== null} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40" title="Record audio">
            <Mic className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Audience toggle */}
          <div className="flex bg-[#F5F5F5] rounded-full p-0.5 gap-0.5">
            {AUDIENCE_OPTS.map(({ value, icon: Icon, label }) => (
              <button key={value} onClick={() => setAudience(value)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${audience === value ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'}`}>
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
          <button onClick={handlePost} disabled={(!text.trim() && mediaItems.length === 0) || saving}
            className="w-9 h-9 bg-[#111111] rounded-full flex items-center justify-center disabled:opacity-40">
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feed Item ────────────────────────────────────────────────────────────────
function FeedItem({ post }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef();
  const date = post.created_date ? new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const AudienceIcon = post.audience === 'private' ? Lock : post.audience === 'connections' ? Users : Globe;

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <MoodRingAvatar src={post.profile_picture_url} mood={post.current_mood} size={32} name={post.username} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111111] leading-tight">@{post.username}</p>
          <p className="text-[11px] text-gray-400">{date}</p>
        </div>
        <AudienceIcon className="w-3.5 h-3.5 text-gray-300" />
      </div>

      {post.content && <p className="text-sm text-[#111111] leading-relaxed px-4 pb-3 whitespace-pre-wrap">{post.content}</p>}

      {(post.media_urls?.length > 0) && (
        <div className={`${post.media_urls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
          {post.media_urls.map((url, i) => {
            const type = post.media_types?.[i] || 'image';
            if (type === 'image') return (
              <img key={i} src={url} className="w-full object-cover max-h-96" alt="" />
            );
            if (type === 'video') return (
              <video key={i} src={url} className="w-full max-h-96 object-cover" controls />
            );
            if (type === 'audio') return (
              <div key={i} className="bg-[#F5F5F5] px-4 py-3 flex items-center gap-3">
                <button onClick={toggleAudio} className="w-10 h-10 bg-[#111111] rounded-full flex items-center justify-center flex-shrink-0">
                  {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                </button>
                <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} />
                <div className="flex-1">
                  <div className="h-1 bg-gray-200 rounded-full"><div className="h-1 bg-[#111111] rounded-full w-0" /></div>
                </div>
              </div>
            );
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HandlePage() {
  const { handle: rawHandle } = useParams();
  const handle = rawHandle?.startsWith('@') || rawHandle?.startsWith('%40') ? rawHandle.replace(/^(@|%40)/, '') : rawHandle;
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = loading
  const [targetProfile, setTargetProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => setCurrentUser(u || null));
  }, []);

  // Load profile + posts
  useEffect(() => {
    if (currentUser === undefined) return;
    loadData();
  }, [handle, currentUser]);

  const loadData = async () => {
    setLoading(true);
    // Find profile by username
    const profileSnap = await getDocs(query(collection(db, 'user_profiles'), where('username', '==', handle)));
    if (profileSnap.empty) { setNotFound(true); setLoading(false); return; }

    const profileDoc = profileSnap.docs[0];
    const profile = { id: profileDoc.id, ...profileDoc.data() };
    setTargetProfile(profile);

    const owner = currentUser?.uid === profile.user_id;
    setIsOwner(owner);

    // Check if current user is a connection (inner circle)
    let connected = false;
    if (currentUser && !owner) {
      const connSnap = await getDocs(query(
        collection(db, 'connections'),
        where('user_id', '==', currentUser.uid),
        where('connected_user_id', '==', profile.user_id)
      ));
      connected = !connSnap.empty;
    }
    setIsConnected(connected);

    // Query posts - get profile owner's posts AND their connections' posts
    try {
      let allFeedPosts = [];

      // 1. Get profile owner's posts
      // For unauthenticated or non-owner/non-connected users, query ONLY public entries
      // This is required because Firestore rules reject queries that MIGHT return docs
      // the user can't access. For owner/connected, query all then filter client-side.
      let ownerPosts = [];
      if (owner) {
        // Owner: fetch all their own entries (rules allow user_id match)
        const snap = await getDocs(query(collection(db, 'journal_entries'), where('user_id', '==', profile.user_id)));
        ownerPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else if (currentUser && connected) {
        // Connected user: fetch all by user_id, filter client-side
        const snap = await getDocs(query(collection(db, 'journal_entries'), where('user_id', '==', profile.user_id)));
        ownerPosts = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.audience !== 'private');
      } else {
        // Public / not logged in: query ONLY by audience to avoid composite index requirement
        // Then filter by user_id client-side
        const snap = await getDocs(query(collection(db, 'journal_entries'), where('audience', '==', 'public')));
        ownerPosts = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.user_id === profile.user_id);
      }

      const filteredOwnerPosts = ownerPosts.filter(p => !p.is_deleted);

      allFeedPosts.push(...filteredOwnerPosts);

      // 2. If owner is viewing their own profile, also show connections' public posts
      if (owner && currentUser?.uid) {
        const connectionsSnap = await getDocs(query(collection(db, 'connections'), where('user_id', '==', currentUser.uid)));
        const connectionUserIds = connectionsSnap.docs.map(d => d.data().connected_user_id);

        if (connectionUserIds.length > 0) {
          const connectionPostsSnap = await getDocs(query(
            collection(db, 'journal_entries'),
            orderBy('created_date', 'desc')
          ));

          const connectionPosts = connectionPostsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p =>
              connectionUserIds.includes(p.user_id) &&
              p.user_id !== profile.user_id &&
              !p.is_deleted &&
              (p.audience === 'public' || p.audience === 'connections')
            );

          allFeedPosts.push(...connectionPosts);
        }
      }

      // Sort all posts by date
      allFeedPosts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Fetch all profiles to enrich posts with author info
      const profilesSnap = await getDocs(collection(db, 'user_profiles'));
      const profilesMap = {};
      profilesSnap.docs.forEach(d => {
        const data = d.data();
        profilesMap[data.user_id] = data;
      });

      // Enrich posts with profile data
      const enrichedPosts = allFeedPosts.map(p => ({
        ...p,
        profile_picture_url: profilesMap[p.user_id]?.profile_picture_url || profile.profile_picture_url,
        current_mood: profilesMap[p.user_id]?.current_mood || profile.current_mood,
        username: profilesMap[p.user_id]?.username || p.username,
      }));

      setPosts(enrichedPosts);
    } catch (err) {
      console.error('Error loading feed:', err);
      setPosts([]);
    }
    setLoading(false);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <Image src="/logo.png" alt="Lifescribe" width={56} height={56} className="mb-6 opacity-40" />
        <p className="text-lg font-semibold text-[#111111] mb-2">@{handle} not found</p>
        <p className="text-sm text-gray-400 mb-6">This handle doesn't exist on Lifescribe yet.</p>
        <button onClick={() => router.back()} className="text-sm text-[#1A1A2E] underline">Go back</button>
      </div>
    );
  }

  if (loading || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#111111] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-gray-400 p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <MoodRingAvatar
              src={targetProfile?.profile_picture_url}
              mood={targetProfile?.current_mood}
              size={44}
              name={targetProfile?.full_name}
            />
            <div className="min-w-0">
              <p className="font-bold text-[#111111] text-base leading-tight truncate">{targetProfile?.full_name || `@${handle}`}</p>
              <p className="text-xs text-gray-400">@{handle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {isOwner && <span className="text-[11px] bg-[#1A1A2E] text-white px-2.5 py-1 rounded-full font-medium">Your feed</span>}
            {isConnected && !isOwner && <span className="text-[11px] bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Inner Circle</span>}
          </div>
        </div>

        {targetProfile?.bio && (
          <p className="text-xs text-gray-500 pl-1 pb-1">{targetProfile.bio}</p>
        )}
      </div>

      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {/* Composer (only for owner) */}
        {isOwner && (
          <PostComposer currentUser={currentUser} profile={targetProfile} onPosted={loadData} />
        )}

        {/* Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <Image src="/logo.png" alt="" width={48} height={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm text-gray-400">
              {isOwner ? 'Share your first memory above.' : 'Nothing public here yet.'}
            </p>
          </div>
        ) : (
          posts.map(post => <FeedItem key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
