'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Crown, Shield, Bell, Mail, Lock, Info, FileText, LogOut, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { auth } from '@/lib/firebase';

const menuItems = [
  { id: 'subscription', label: 'Subscription', icon: Crown, page: 'Subscription' },
  { id: 'memorial', label: 'Memorial Settings', icon: Shield, page: 'MemorialSettings' },
  { id: 'notifications', label: 'Notifications', icon: Bell, page: 'NotificationSettings' },
  { id: 'email', label: 'Change Email', icon: Mail, page: 'ChangeEmail' },
  { id: 'password', label: 'Change Password', icon: Lock, page: 'ChangePassword' },
  { id: 'about', label: 'About Us', icon: Info, page: 'AboutUs' },
  { id: 'privacy', label: 'Privacy Policy', icon: FileText, page: 'PrivacyPolicy' },
  { id: 'terms', label: 'Terms and Conditions', icon: FileText, page: 'TermsConditions' },
];

export default function AppSettings() {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const { data: profiles = [] } = useQuery({ queryKey: ['user_profiles'], queryFn: () => base44.entities.UserProfile.list() });
  const profile = profiles[0] || {};
  const planLabel = profile.plan_type === 'legacy_plus' ? 'Legacy Plus' : profile.plan_type === 'family_legacy' ? 'Family Legacy' : profile.plan_type === 'free_trial' ? 'Free Trial' : 'Free';

  const getSignInMethod = () => {
    if (authLoading) return 'Loading...';
    if (!currentUser) return 'Not signed in';
    if (!currentUser.providerData?.length) return 'Email';
    const provider = currentUser.providerData[0].providerId;
    return provider === 'password' ? 'Email' : provider === 'google.com' ? 'Google' : provider;
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    router.push(createPageUrl('Splash'));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => { try { router.back(); } catch { router.push(createPageUrl('Profile')); } }} className="text-gray-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Settings</h1>
      </div>

      <div className="px-4">
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 px-2 mb-2 uppercase tracking-wider">Account</p>
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-[#111111] truncate">{authLoading ? 'Loading...' : (currentUser?.email || 'Not signed in')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Sign-in method</p>
                <p className="text-sm text-[#111111]">{getSignInMethod()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 px-2 mb-2 uppercase tracking-wider">Profile</p>
          {['About Me', 'Location', 'Relationship', 'Work'].map(section => (
            <button key={section} onClick={() => router.push(createPageUrl('EditProfile') + `?section=${section.toLowerCase()}`)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-sm text-[#111111]">Edit {section}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 px-2 mb-2 uppercase tracking-wider">General</p>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => router.push(createPageUrl(item.page))}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-[#111111] flex-1 text-left">{item.label}</span>
                {item.id === 'subscription' && <span className="text-xs text-gray-400">{planLabel}</span>}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            );
          })}
        </div>

        <button onClick={() => setShowLogout(true)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors mt-4">
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-500 font-medium">Logout</span>
        </button>
      </div>

      <AlertDialog open={showLogout} onOpenChange={setShowLogout}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Logout?</AlertDialogTitle><AlertDialogDescription>Are you sure you want to sign out of Lifescribe?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
