export type AuthUser = {
  username: string;
  email: string;
};

type AuthState = {
  user: AuthUser;
};

const STORAGE_KEY = 'skillsense-auth';

export function setAuthUser(user: AuthUser): void {
  const state: AuthState = { user };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed && parsed.user && parsed.user.email && parsed.user.username) {
      return parsed.user;
    }
    return null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}


