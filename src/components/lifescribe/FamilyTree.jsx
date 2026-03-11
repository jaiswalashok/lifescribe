'use client';
import React from 'react';
import MoodRingAvatar from './MoodRingAvatar';
import { Plus } from 'lucide-react';

const RELATIONSHIP_GROUPS = {
  grandparents: ['Grandfather', 'Grandmother'],
  parents: ['Father', 'Mother'],
  siblings: ['Brother', 'Sister'],
  children: ['Son', 'Daughter'],
  grandchildren: ['Grand Son', 'Grand Daughter'],
  extended: ['Uncle', 'Aunt', 'Nephew', 'Niece', 'Cousin', 'Great Uncle', 'Great Aunt', 'Second Cousin', 'Father-in-law', 'Mother-in-law'],
};

function TreeNode({ connection, isSelf, selfProfile, onTap, onAdd, addLabel }) {
  if (!connection && !isSelf) {
    return (
      <button onClick={onAdd} className="flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
          <Plus className="w-5 h-5 text-gray-300" />
        </div>
        <span className="text-[10px] text-gray-300 font-medium">{addLabel || 'Add'}</span>
      </button>
    );
  }

  const name = isSelf ? (selfProfile?.full_name || 'You') : connection?.name || connection?.connected_user_name;
  const avatar = isSelf ? selfProfile?.profile_picture_url : connection?.avatar || connection?.connected_user_avatar;
  const mood = isSelf ? selfProfile?.current_mood : connection?.mood || connection?.connected_user_mood;
  const relationLabel = isSelf ? 'You' : (connection?.relationship || connection?.relationship_label);

  return (
    <button
      onClick={() => !isSelf && onTap?.(connection)}
      className="flex flex-col items-center gap-1 max-w-[72px]"
    >
      <MoodRingAvatar src={avatar} mood={mood} size={52} name={name} />
      <span className="text-xs font-medium text-[#111111] text-center leading-tight line-clamp-2 w-full">{name}</span>
      <span className="text-[10px] text-gray-400 text-center leading-tight">{relationLabel}</span>
    </button>
  );
}

export default function FamilyTree({ connections, selfProfile, onTapNode, onAddNode }) {
  // Support both .relationship (inferred) and .relationship_label (Connection records)
  const rel = (c) => c.relationship || c.relationship_label || '';

  const grandparents = connections.filter(c => RELATIONSHIP_GROUPS.grandparents.includes(rel(c)));
  const parents = connections.filter(c => RELATIONSHIP_GROUPS.parents.includes(rel(c)));
  const partner = connections.find(c => rel(c) === 'Partner');
  const siblings = connections.filter(c => RELATIONSHIP_GROUPS.siblings.includes(rel(c)));
  const children = connections.filter(c => RELATIONSHIP_GROUPS.children.includes(rel(c)));
  const grandchildren = connections.filter(c => RELATIONSHIP_GROUPS.grandchildren.includes(rel(c)));
  const extended = connections.filter(c => RELATIONSHIP_GROUPS.extended.includes(rel(c)));

  const sections = [
    grandparents.length > 0 && { label: 'Grandparents', nodes: grandparents },
    parents.length > 0 && { label: 'Parents', nodes: parents },
    { label: 'You', isSelf: true },
    siblings.length > 0 && { label: 'Siblings', nodes: siblings },
    children.length > 0 && { label: 'Children', nodes: children },
    grandchildren.length > 0 && { label: 'Grandchildren', nodes: grandchildren },
    extended.length > 0 && { label: 'Extended Family', nodes: extended },
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-0 py-4">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          {/* Connecting line */}
          {i > 0 && <div className="w-px h-5 bg-gray-200" />}

          {/* Label */}
          <span className="text-[10px] uppercase tracking-wider text-gray-300 font-medium mb-3">
            {section.label}
          </span>

          {section.isSelf ? (
            <div className="flex items-end gap-8 justify-center">
              <TreeNode isSelf selfProfile={selfProfile} />
              {partner ? (
                <TreeNode connection={partner} onTap={onTapNode} />
              ) : (
                <TreeNode onAdd={() => onAddNode?.('Partner')} addLabel="Partner" />
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-6 justify-center px-4">
              {section.nodes.map((conn, j) => (
                <TreeNode key={conn.id || `${conn.name}-${j}`} connection={conn} onTap={onTapNode} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}