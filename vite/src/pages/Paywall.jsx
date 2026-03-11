import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const REGIONS = [
  { id: 'developed', label: 'Developed Markets', note: 'USA, Singapore, Hong Kong, EU, UK, Australia, Japan' },
  { id: 'emerging', label: 'Emerging Markets', note: 'Malaysia, Thailand, Vietnam, Philippines, Indonesia' },
  { id: 'lowest', label: 'Lowest-Income Markets', note: 'India, Bangladesh, Pakistan, Myanmar, Cambodia' },
];

const INDIVIDUAL_PLANS = [
  {
    storage: '50GB',
    prices: {
      developed: { monthly: 10, annual: 100 },
      emerging: { monthly: 5, annual: 50 },
      lowest: { monthly: 3, annual: 30 },
    },
  },
  {
    storage: '200GB',
    prices: {
      developed: { monthly: 15, annual: 150 },
      emerging: { monthly: 8, annual: 80 },
      lowest: { monthly: 5, annual: 50 },
    },
  },
  {
    storage: '500GB',
    prices: {
      developed: { monthly: 20, annual: 200 },
      emerging: { monthly: 10, annual: 100 },
      lowest: { monthly: 7, annual: 70 },
    },
  },
  {
    storage: '1TB',
    prices: {
      developed: { monthly: 30, annual: 300 },
      emerging: { monthly: 15, annual: 150 },
      lowest: { monthly: 10, annual: 100 },
    },
  },
];

const FAMILY_PLANS = [
  { storage: '200GB', monthly: 20, annual: 200, savings: 40 },
  { storage: '500GB', monthly: 30, annual: 300, savings: 60 },
  { storage: '1TB', monthly: 40, annual: 400, savings: 80 },
  { storage: '2TB', monthly: 50, annual: 500, savings: 100 },
  { storage: '5TB', monthly: 75, annual: 750, savings: 150 },
  { storage: '10TB', monthly: 120, annual: 1200, savings: 240 },
];

const FEATURES = [
  'Unlimited entries (limited by storage only)',
  'Unlimited LifeCircles',
  'Unlimited LifeTrustees',
  'Unlimited LifeChapters',
  'Unlimited MomentCapsules',
  'Multi-device sync',
  'End-to-end encryption',
  'Full data export',
  'No ads, ever',
  'Data never sold',
];

export default function Paywall() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [region, setRegion] = useState('developed');
  const [planType, setPlanType] = useState('individual'); // 'individual' | 'family'
  const [selectedStorage, setSelectedStorage] = useState('50GB');
  const [selectedFamilyStorage, setSelectedFamilyStorage] = useState('200GB');
  const [showRegionNote, setShowRegionNote] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  const handleStartTrial = () => {
    localStorage.setItem('lifescribe_plan', 'free_trial');
    navigate(createPageUrl('Home'));
  };

  const handleSubscribe = () => {
    // Prototype only – no live payments
    const storage = planType === 'individual' ? selectedStorage : selectedFamilyStorage;
    localStorage.setItem('lifescribe_plan', planType === 'individual' ? 'legacy_plus' : 'family_legacy');
    localStorage.setItem('lifescribe_storage', storage);
    navigate(createPageUrl('Home'));
  };

  const selectedRegionNote = REGIONS.find(r => r.id === region)?.note;

  // Compute display price
  let displayPrice = null;
  if (planType === 'individual') {
    const plan = INDIVIDUAL_PLANS.find(p => p.storage === selectedStorage);
    if (plan) {
      displayPrice = plan.prices[region][billing];
    }
  } else {
    const plan = FAMILY_PLANS.find(p => p.storage === selectedFamilyStorage);
    if (plan) {
      displayPrice = billing === 'monthly' ? plan.monthly : plan.annual;
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-5 pt-12 pb-10 max-w-md mx-auto">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#111111] mb-6 -ml-1">
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-[#111111] mb-1">Simple pricing. All features included.</h1>
      <p className="text-sm text-gray-400 mb-1">Choose based on the storage you need.</p>
      <p className="text-xs text-gray-300 mb-7">Pricing adjusted for your region. Affordable to everyone, everywhere.</p>

      {/* Trial Banner */}
      <div className="bg-[#F5F5F5] rounded-2xl p-4 mb-6">
        <p className="text-sm font-semibold text-[#111111] mb-0.5">3 months free — all features unlocked</p>
        <p className="text-xs text-gray-400">After trial: read-only access until you subscribe. You can always view your memories.</p>
      </div>

      {/* Plan Type Toggle */}
      <div className="flex bg-[#F5F5F5] rounded-full p-1 mb-6">
        {['individual', 'family'].map(type => (
          <button
            key={type}
            onClick={() => setPlanType(type)}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
              planType === type ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'
            }`}
          >
            {type === 'individual' ? 'Individual' : 'Family'}
          </button>
        ))}
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-[#F5F5F5] rounded-full p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
              billing === 'monthly' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
              billing === 'annual' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-400'
            }`}
          >
            Annual
            <span className="ml-1 text-[10px] text-green-600 font-semibold">-17%</span>
          </button>
        </div>
        {billing === 'annual' && (
          <span className="text-xs text-green-600 font-medium">2 months free</span>
        )}
      </div>

      {planType === 'individual' && (
        <>
          {/* Region Selector */}
          <div className="mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setRegion(r.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    region === r.id
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F5F5F5] text-gray-500'
                  }`}
                >
                  {r.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRegionNote(!showRegionNote)}
              className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5"
            >
              {REGIONS.find(r => r.id === region)?.label}
              {showRegionNote ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showRegionNote && (
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{selectedRegionNote}</p>
            )}
          </div>

          {/* Individual Storage Options */}
          <div className="space-y-2.5 mb-6">
            {INDIVIDUAL_PLANS.map(plan => {
              const price = plan.prices[region][billing];
              const isSelected = selectedStorage === plan.storage;
              return (
                <button
                  key={plan.storage}
                  onClick={() => setSelectedStorage(plan.storage)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? 'border-[#111111] bg-[#FAFAFA]' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#111111]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-[#111111] rounded-full" />}
                      </div>
                      <span className="font-semibold text-[#111111] text-sm">{plan.storage}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#111111] text-sm">${price}</p>
                      <p className="text-[10px] text-gray-400">{billing === 'monthly' ? '/month' : '/year'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {planType === 'family' && (
        <>
          {/* Family Plan Info */}
          <div className="bg-blue-50 rounded-2xl p-4 mb-4">
            <p className="text-sm font-semibold text-[#111111] mb-1">Share storage with unlimited family members</p>
            <p className="text-xs text-gray-500 leading-relaxed">Add anyone from your Family Circle. Storage is shared. One person pays for the whole family.</p>
          </div>

          {/* Family Storage Options */}
          <div className="space-y-2.5 mb-6">
            {FAMILY_PLANS.map(plan => {
              const price = billing === 'monthly' ? plan.monthly : plan.annual;
              const isSelected = selectedFamilyStorage === plan.storage;
              return (
                <button
                  key={plan.storage}
                  onClick={() => setSelectedFamilyStorage(plan.storage)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    isSelected ? 'border-[#111111] bg-[#FAFAFA]' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#111111]' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-[#111111] rounded-full" />}
                      </div>
                      <span className="font-semibold text-[#111111] text-sm">{plan.storage}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#111111] text-sm">${price}</p>
                      <p className="text-[10px] text-gray-400">{billing === 'monthly' ? '/month' : '/year'}</p>
                      {billing === 'annual' && (
                        <p className="text-[10px] text-green-600">Save ${plan.savings}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* What's Included */}
      <button
        onClick={() => setShowFeatures(!showFeatures)}
        className="flex items-center justify-between w-full mb-3 text-sm font-medium text-[#111111]"
      >
        <span>What's included (all plans)</span>
        {showFeatures ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {showFeatures && (
        <div className="space-y-2 mb-6">
          {FEATURES.map(f => (
            <div key={f} className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-500">{f}</span>
            </div>
          ))}
        </div>
      )}
      {!showFeatures && <div className="mb-4" />}

      {/* CTAs */}
      <Button
        onClick={handleStartTrial}
        className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-sm font-semibold mb-3"
      >
        Start 3 months free
      </Button>
      <Button
        onClick={handleSubscribe}
        variant="outline"
        className="w-full border-gray-200 text-[#111111] hover:bg-gray-50 rounded-full h-12 text-sm font-medium"
      >
        Subscribe now · ${displayPrice}/{billing === 'monthly' ? 'mo' : 'yr'}
      </Button>

      <p className="text-center text-[10px] text-gray-400 mt-4">
        No ads · No data selling · You own 100% of your content
      </p>
      <p className="text-center text-[10px] text-gray-300 mt-3 leading-relaxed px-4">
        By continuing you agree to Lifescribe's Privacy Policy and Terms and Conditions.
      </p>
    </div>
  );
}