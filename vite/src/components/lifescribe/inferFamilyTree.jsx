const COMPOSITION_MAP = {
  'Father>Father': 'Grandfather',
  'Father>Mother': 'Grandmother',
  'Father>Brother': 'Uncle',
  'Father>Sister': 'Aunt',
  'Father>Son': 'Brother',
  'Father>Daughter': 'Sister',
  'Mother>Father': 'Grandfather',
  'Mother>Mother': 'Grandmother',
  'Mother>Brother': 'Uncle',
  'Mother>Sister': 'Aunt',
  'Mother>Son': 'Brother',
  'Mother>Daughter': 'Sister',
  'Brother>Son': 'Nephew',
  'Brother>Daughter': 'Niece',
  'Brother>Father': 'Father',
  'Brother>Mother': 'Mother',
  'Sister>Son': 'Nephew',
  'Sister>Daughter': 'Niece',
  'Sister>Father': 'Father',
  'Sister>Mother': 'Mother',
  'Son>Son': 'Grand Son',
  'Son>Daughter': 'Grand Daughter',
  'Daughter>Son': 'Grand Son',
  'Daughter>Daughter': 'Grand Daughter',
  'Grandfather>Son': 'Uncle',
  'Grandfather>Daughter': 'Aunt',
  'Grandfather>Brother': 'Great Uncle',
  'Grandfather>Sister': 'Great Aunt',
  'Grandmother>Son': 'Uncle',
  'Grandmother>Daughter': 'Aunt',
  'Uncle>Son': 'Cousin',
  'Uncle>Daughter': 'Cousin',
  'Aunt>Son': 'Cousin',
  'Aunt>Daughter': 'Cousin',
  'Great Uncle>Son': 'Second Cousin',
  'Great Uncle>Daughter': 'Second Cousin',
  'Great Aunt>Son': 'Second Cousin',
  'Great Aunt>Daughter': 'Second Cousin',
  'Partner>Father': 'Father-in-law',
  'Partner>Mother': 'Mother-in-law',
  'Partner>Son': 'Son',
  'Partner>Daughter': 'Daughter',
};

function buildGraph(allRelationships) {
  const graph = {};
  for (const rel of allRelationships) {
    if (!rel.to_user_id || !rel.from_user_id) continue;
    if (!graph[rel.from_user_id]) graph[rel.from_user_id] = [];
    graph[rel.from_user_id].push({
      userId: rel.to_user_id,
      relationship: rel.relationship,
      name: rel.to_user_name,
    });
  }
  return graph;
}

export function inferRelatives(myUserId, allRelationships, myDirectConnections) {
  const graph = buildGraph(allRelationships);

  // Build name -> userId from FamilyRelationship to_user_name fields
  const toUserIdToName = {};
  const fromUserIdToRelRecords = {};
  for (const rel of allRelationships) {
    if (rel.to_user_id && rel.to_user_name) {
      toUserIdToName[rel.to_user_id] = rel.to_user_name;
    }
    if (rel.from_user_id) {
      if (!fromUserIdToRelRecords[rel.from_user_id]) fromUserIdToRelRecords[rel.from_user_id] = [];
      fromUserIdToRelRecords[rel.from_user_id].push(rel);
    }
  }

  const nameToConnection = {};
  for (const conn of myDirectConnections) {
    if (conn.connected_user_name) nameToConnection[conn.connected_user_name] = conn;
  }

  const known = new Map();

  // Step 1: Seed from FamilyRelationship records where from_user_id === myUserId
  const myFamilyRels = allRelationships.filter(r => r.from_user_id === myUserId && r.to_user_id);
  for (const rel of myFamilyRels) {
    const conn = nameToConnection[rel.to_user_name];
    known.set(rel.to_user_id, {
      relationship: rel.relationship,
      name: rel.to_user_name,
      avatar: conn?.connected_user_avatar || null,
      mood: conn?.connected_user_mood || null,
      isInferred: false,
    });
  }

  // Step 2: Seed from Connection records, resolving user IDs
  for (const conn of myDirectConnections) {
    const relLabel = conn.relationship_label || conn.relationship;
    if (!relLabel) continue;
    const name = conn.connected_user_name;
    let userId = conn.connected_user_id;

    // Try name match in FamilyRelationship to_user_name
    if (!userId) {
      for (const rel of allRelationships) {
        if (rel.to_user_name === name && rel.to_user_id) { userId = rel.to_user_id; break; }
      }
    }

    // Try heuristic: find a from_user_id (not me) whose targets include known people
    // AND whose composition with relLabel yields valid relationships
    if (!userId) {
      for (const [fromId, records] of Object.entries(fromUserIdToRelRecords)) {
        if (fromId === myUserId) continue;
        const hasKnownTarget = records.some(r => known.has(r.to_user_id));
        if (hasKnownTarget) {
          const consistent = records.some(r => COMPOSITION_MAP[`${relLabel}>${r.relationship}`] !== undefined);
          if (consistent) {
            userId = fromId;
            toUserIdToName[fromId] = name;
            break;
          }
        }
      }
    }

    // Fallback: synthetic ID
    if (!userId) {
      userId = `__conn__${name}`;
      toUserIdToName[userId] = name;
    }

    if (!known.has(userId)) {
      known.set(userId, {
        relationship: relLabel,
        name,
        avatar: conn.connected_user_avatar || null,
        mood: conn.connected_user_mood || null,
        isInferred: false,
      });
    }
  }

  // Step 3: BFS to discover inferred relatives
  const visited = new Set([myUserId]);
  for (const uid of known.keys()) visited.add(uid);
  const queue = [];
  for (const [uid, info] of known.entries()) queue.push({ userId: uid, relationshipToMe: info.relationship });

  while (queue.length > 0) {
    const { userId, relationshipToMe } = queue.shift();
    const neighbors = graph[userId] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.userId)) continue;
      const inferred = COMPOSITION_MAP[`${relationshipToMe}>${neighbor.relationship}`];
      if (inferred) {
        visited.add(neighbor.userId);
        const resolvedName = toUserIdToName[neighbor.userId] || neighbor.name;
        known.set(neighbor.userId, { relationship: inferred, name: resolvedName, avatar: null, mood: null, isInferred: true });
        queue.push({ userId: neighbor.userId, relationshipToMe: inferred });
      }
    }
  }

  return known;
}