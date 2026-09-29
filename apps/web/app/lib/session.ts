export interface StoredUser {
  email: string;
  name: string;
  platformRole: string | null;
  memberships: Array<{
    organizationId: string;
    role: string;
  }>;
}

export interface StoredSession {
  token: string;
  user: StoredUser;
}

const tokenKey = "globalwork.authToken";
const userKey = "globalwork.authUser";

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem(tokenKey);
  const rawUser = window.localStorage.getItem(userKey);
  if (!token || !rawUser) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(rawUser) as StoredUser
    };
  } catch {
    clearSession();
    return null;
  }
}

export function storeSession(session: StoredSession): void {
  window.localStorage.setItem(tokenKey, session.token);
  window.localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function clearSession(): void {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(userKey);
  window.localStorage.removeItem("globalwork.platformRole");
}

export function canViewFinance(user: StoredUser | null): boolean {
  if (!user) {
    return false;
  }

  if (["PLATFORM_ADMIN", "PAYROLL_SPECIALIST", "FINANCE_OPS"].includes(user.platformRole ?? "")) {
    return true;
  }

  return user.memberships.some((membership) => ["CLIENT_OWNER", "CLIENT_FINANCE"].includes(membership.role));
}
