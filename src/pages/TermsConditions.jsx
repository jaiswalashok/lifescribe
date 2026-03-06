import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Terms and Conditions</h1>
      </div>
      <div className="px-6 pb-12">
        <div className="prose prose-sm prose-gray max-w-none">
          <h3>1. Acceptance of Terms</h3>
          <p>By creating an account on Lifescribe, you agree to be bound by these terms and conditions. If you do not agree, please do not use the service.</p>
          <h3>2. Account Responsibilities</h3>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.</p>
          <h3>3. Content Ownership</h3>
          <p>You retain full ownership of all content you create on Lifescribe, including journal entries, media, and memories. By using the service, you grant Lifescribe a limited license to store and display your content according to your privacy settings.</p>
          <h3>4. Memorial and Legacy Features</h3>
          <p>Lifescribe's memorial settings are provided in good faith. While we strive to honor your legacy preferences, certain legal requirements may apply depending on your jurisdiction.</p>
          <h3>5. Subscription and Billing</h3>
          <p>Paid subscriptions are billed according to the plan selected. You may cancel at any time. Refunds are handled on a case-by-case basis.</p>
        </div>
      </div>
    </div>
  );
}