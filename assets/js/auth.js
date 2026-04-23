import { supabase } from './supabase-client.js';

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return data;
}

export async function requireAuth(allowedRoles = null) {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const profile = await getProfile();
  if (!profile) {
    window.location.href = 'login.html';
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    window.location.href = 'dashboard.html';
    return null;
  }

  return profile;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

export function renderUserInfo(profile) {
  const el = document.getElementById('user-info');
  if (!el || !profile) return;
  const roleLabel = { admin: '관리자', skb_manager: 'SKB담당자', partner_bp: '협력사', requester: '요청자' };
  el.innerHTML = `<span>${profile.full_name}</span> <span class="role-badge role-${profile.role}">${roleLabel[profile.role] || profile.role}</span>`;
}
