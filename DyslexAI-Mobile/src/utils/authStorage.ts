import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInfo } from '../api/auth';

const TOKEN_KEY = '@dyslexai/auth_token';
const USER_KEY = '@dyslexai/auth_user';

export async function setAuth(token: string, user: UserInfo): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getUser(): Promise<UserInfo | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
