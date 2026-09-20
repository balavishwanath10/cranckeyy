const BASE_URL = '/api';

export async function requestOtp(identifier) {
  const res = await fetch(`${BASE_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  return res.json();
}

export async function verifyOtp(identifier, otp, displayName = '') {
  const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, otp, displayName })
  });
  return res.json();
}

export async function establishPairApi(user1, user2) {
  const res = await fetch(`${BASE_URL}/auth/establish-pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user1, user2 })
  });
  return res.json();
}

export async function fetchCurrentMessages(identifier = '') {
  const url = identifier ? `${BASE_URL}/messages/current?identifier=${encodeURIComponent(identifier)}` : `${BASE_URL}/messages/current`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchAllSessions() {
  const res = await fetch(`${BASE_URL}/sessions`);
  return res.json();
}

export async function createNewSessionApi() {
  const res = await fetch(`${BASE_URL}/sessions/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/messages`);
  return res.json();
}

export async function openSessionApi(sessionId, identifier = '') {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  return res.json();
}

export async function deleteSessionApi(sessionId, identifier = '') {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier })
  });
  return res.json();
}

export async function fetchProfiles(identifier = '') {
  const url = identifier 
    ? `${BASE_URL}/profiles?identifier=${encodeURIComponent(identifier)}` 
    : `${BASE_URL}/profiles`;
  const res = await fetch(url);
  return res.json();
}

export async function updateProfilesApi(selfPhone, selfData, partnerData) {
  const res = await fetch(`${BASE_URL}/profiles/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfPhone, selfData, partnerData })
  });
  return res.json();
}

export async function updateSelfProfileApi(selfPhone, selfData) {
  const res = await fetch(`${BASE_URL}/profiles/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfPhone, selfData })
  });
  return res.json();
}

export async function markMessagesReadApi(sessionId, readerId) {
  const res = await fetch(`${BASE_URL}/messages/mark-read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, readerId })
  });
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  return res.json();
}

export async function saveSettings(settings) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export function isSameUser(u, target) {
  if (!u || !target) return false;
  const id1 = String(u?.phone_number || u?.identifier || u || '').trim().toLowerCase();
  const id2 = String(target?.phone_number || target?.identifier || target || '').trim().toLowerCase();
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  if (!id1.includes('@') && !id2.includes('@')) {
    const d1 = id1.replace(/\D/g, '');
    const d2 = id2.replace(/\D/g, '');
    if (d1 && d2) {
      return d1.endsWith(d2) || d2.endsWith(d1);
    }
  }
  return false;
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}
