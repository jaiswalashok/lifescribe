'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Privacy Policy</h1>
      </div>
      <div className="px-6 pb-12">
        <div className="prose prose-sm prose-gray max-w-none">
          <h3>1. Information We Collect</h3>
          <p>Lifescribe collects personal information you provide when creating an account, including your name, email address, date of birth, and profile picture. We also collect journal entries, media uploads, and connection information you choose to share within the platform.</p>
          <h3>2. How We Use Your Information</h3>
          <p>Your information is used to provide and improve the Lifescribe service, enable connections between users, and deliver your memorial and legacy settings according to your preferences.</p>
          <h3>3. Data Storage and Security</h3>
          <p>All data is encrypted in transit and at rest. Your journal entries and personal memories are stored securely and are only accessible according to your privacy settings.</p>
          <h3>4. Sharing and Disclosure</h3>
          <p>We never share your personal data with third parties for marketing purposes. Your entries are only visible to the audiences you designate (private, connections, or as specified in your legacy settings).</p>
          <h3>5. Your Rights</h3>
          <p>You have the right to access, correct, or delete your personal data at any time. You can export your data or request account deletion through the settings menu.</p>
        </div>
      </div>
    </div>
  );
}
