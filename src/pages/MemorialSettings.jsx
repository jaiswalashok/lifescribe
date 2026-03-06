import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Toast from '../components/lifescribe/Toast';
import MoodRingAvatar from '../components/lifescribe/MoodRingAvatar';
import BottomSheet from '../components/lifescribe/BottomSheet';
import EmptyState from '../components/lifescribe/EmptyState';
import { ChevronLeft, Trash2, Plus, Info, Shield, Heart } from 'lucide-react';

export default function MemorialSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [inactivityDays, setInactivityDays] = useState(180);
  const [legacyContacts, setLegacyContacts] = useState([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showReportPassed, setShowReportPassed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportingPassed, setReportingPassed] = useState(false);
  const [toast, setToast] = useState('');

  const { data: settings = [] } = useQuery({
    queryKey: ['memorial_settings'],
    queryFn: () => base44.entities.MemorialSetting.list(),
  });

  const { data: trustees = [] } = useQuery({
    queryKey: ['life_trustees'],
    queryFn: () => base44.entities.LifeTrustee.list(),
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['connections'],
    queryFn: () => base44.entities.Connection.list(),
  });

  useEffect(() => {
    if (settings.length > 0) {
      setInactivityDays(settings[0].inactivity_days || 180);
      setLegacyContacts(
        (settings[0].legacy_contact_names || []).map((name, i) => ({
          name,
          avatar: settings[0].legacy_contact_avatars?.[i] || '',
          label: settings[0].legacy_contact_labels?.[i] || '',
          id: settings[0].legacy_contact_ids?.[i] || '',
        }))
      );
    }
  }, [settings]);

  const removeContact = (index) => {
    setLegacyContacts(prev => prev.filter((_, i) => i !== index));
  };

  const addContactFromConnection = (conn) => {
    setLegacyContacts(prev => [...prev, {
      name: conn.connected_user_name,
      avatar: conn.connected_user_avatar || '',
      label: conn.relationship_label || '',
      id: conn.connected_user_id || conn.id,
    }]);
    setShowAddContact(false);
  };

  const handleReportPassed = async (conn) => {
    setReportingPassed(true);
    try {
      // Send report to Lifescribe backend function
      await base44.functions.invoke('reportConnectionPassed', {
        connection_id: conn.id,
        connected_user_id: conn.connected_user_id,
        connected_user_name: conn.connected_user_name,
      });
      setToast(`Reported that ${conn.connected_user_name} has passed away.`);
      setShowReportPassed(false);
    } catch (error) {
      setToast('Error reporting. Please try again.');
    }
    setReportingPassed(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      inactivity_days: inactivityDays,
      legacy_contact_ids: legacyContacts.map(c => c.id),
      legacy_contact_names: legacyContacts.map(c => c.name),
      legacy_contact_avatars: legacyContacts.map(c => c.avatar),
      legacy_contact_labels: legacyContacts.map(c => c.label),
    };

    if (settings.length > 0) {
      await base44.entities.MemorialSetting.update(settings[0].id, data);
    } else {
      await base44.entities.MemorialSetting.create(data);
    }

    queryClient.invalidateQueries({ queryKey: ['memorial_settings'] });
    setToast('Your memorial settings have been saved.');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-[#111111] ml-3">Memorial Settings</h1>
      </div>

      <div className="px-6">
        {/* Intro */}
        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Your Lifescribe account and memories will be preserved according to these settings in the event of your passing.
        </p>

        {/* Section 1 — Inactivity */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#111111] mb-1">Inactivity Settings</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Set how many days after you have been reported as passed away without verification before deactivating your account.
          </p>
          <Input
            type="number"
            value={inactivityDays}
            onChange={e => setInactivityDays(parseInt(e.target.value) || 180)}
            className="bg-[#F5F5F5] border-0 h-12 rounded-xl text-[#111111] w-32"
          />
          <span className="text-xs text-gray-400 ml-2">days</span>
        </div>

        {/* Section 2 — Legacy Contacts */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#111111] mb-1">Legacy Contacts</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            Add the people who will be responsible for managing your account and memories after you are gone.
          </p>

          {legacyContacts.length > 0 && (
            <div className="space-y-2 mb-3">
              {legacyContacts.map((contact, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-xl">
                  <MoodRingAvatar src={contact.avatar} size={40} name={contact.name} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#111111]">{contact.name}</p>
                    {contact.label && <p className="text-xs text-gray-400">{contact.label}</p>}
                  </div>
                  <button onClick={() => removeContact(i)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => setShowAddContact(true)}
            variant="outline"
            className="rounded-full text-sm border-gray-200 text-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add legacy contact
          </Button>
        </div>

        {/* Section 3 — Report a Connection Passed */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#111111] mb-1">Report a Connection</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            If someone in your connections has passed away, you can report it to Lifescribe so we can preserve their account appropriately.
          </p>
          <Button
            onClick={() => setShowReportPassed(true)}
            variant="outline"
            className="rounded-full text-sm border-gray-200 text-gray-500"
          >
            <Heart className="w-4 h-4 mr-2" />
            Report a passing
          </Button>
        </div>

        {/* Section 4 — LifeTrustees */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#111111] mb-1">LifeTrustees</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            These people will inherit your vault. You decide what they receive and when.
          </p>

          {trustees.length === 0 ? (
            <EmptyState
              icon={Shield}
              message="No one is designated yet. Set this up when you're ready."
              ctaText="Add trustee"
              onAction={() => navigate(createPageUrl('AddTrustee'))}
            />
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {trustees.map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate(createPageUrl('TrusteeDetail') + `?id=${t.id}`)}
                    className="w-full flex items-center gap-3 p-3 bg-[#F5F5F5] rounded-xl text-left"
                  >
                    <MoodRingAvatar src={t.trustee_avatar} mood={t.trustee_mood} size={40} name={t.trustee_name} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#111111]">{t.trustee_name}</p>
                      <p className="text-xs text-gray-400">
                        {t.permissions_type === 'full' ? 'Full vault' : t.permissions_type === 'specific_chapters' ? 'Specific chapters' : 'Everything except'} — {t.delivery_trigger === 'on_death' ? 'upon death' : t.delivery_trigger === 'specific_date' ? 'on specific date' : 'on milestone'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => navigate(createPageUrl('AddTrustee'))}
                variant="outline"
                className="rounded-full text-sm border-gray-200 text-gray-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add trustee
              </Button>
            </>
          )}
        </div>

        {/* Dead Man's Switch info */}
        <div className="bg-[#F5F5F5] rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 leading-relaxed">
              If we do not hear from you for the number of days set above, we will send you an email to confirm you are okay. If there is no response, we will escalate to a phone call. If there is still no response, your legacy contacts will be notified to begin the verification process.
            </p>
          </div>
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#111111] text-white hover:bg-[#333] rounded-full h-12 text-base font-medium disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Add contact sheet */}
      <BottomSheet open={showAddContact} onClose={() => setShowAddContact(false)} title="Add legacy contact">
        <div className="space-y-1">
          {connections.map(conn => (
            <button
              key={conn.id}
              onClick={() => addContactFromConnection(conn)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left"
            >
              <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={36} name={conn.connected_user_name} />
              <div>
                <p className="text-sm font-medium text-[#111111]">{conn.connected_user_name}</p>
                {conn.relationship_label && <p className="text-xs text-gray-400">{conn.relationship_label}</p>}
              </div>
            </button>
          ))}
          {connections.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No connections yet.</p>
          )}
        </div>
      </BottomSheet>

      {/* Report passing sheet */}
      <BottomSheet open={showReportPassed} onClose={() => setShowReportPassed(false)} title="Report a passing">
        <div className="space-y-1">
          {connections.map(conn => (
            <button
              key={conn.id}
              onClick={() => handleReportPassed(conn)}
              disabled={reportingPassed}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left disabled:opacity-50"
            >
              <MoodRingAvatar src={conn.connected_user_avatar} mood={conn.connected_user_mood} size={36} name={conn.connected_user_name} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111111]">{conn.connected_user_name}</p>
                {conn.relationship_label && <p className="text-xs text-gray-400">{conn.relationship_label}</p>}
              </div>
              {reportingPassed && <div className="text-xs text-gray-400">Reporting...</div>}
            </button>
          ))}
          {connections.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No connections yet.</p>
          )}
        </div>
      </BottomSheet>

      <Toast message={toast} show={!!toast} onClose={() => setToast('')} />
    </div>
  );
}