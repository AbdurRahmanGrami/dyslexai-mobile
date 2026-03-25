/**
 * Auth API (scan-backend /auth). Passwords hashed on server; JWT returned.
 */
import { API_BASE_URL } from '../constants/config';

export type UserInfo = { id: number; email: string; name: string };

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: UserInfo;
};

function getDetail(data: unknown): string {
  if (data && typeof data === 'object' && 'detail' in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d) && d.length > 0 && d[0]?.msg) return d[0].msg;
  }
  return '';
}

export async function signup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = getDetail(data) || `Signup failed: ${res.status}`;
    throw new Error(msg);
  }
  return data as AuthResponse;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = getDetail(data) || `Login failed: ${res.status}`;
    throw new Error(msg);
  }
  return data as AuthResponse;
}

export async function getMe(token: string): Promise<UserInfo> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || 'Session expired');
  return data as UserInfo;
}
