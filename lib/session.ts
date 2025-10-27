import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionData } from '@/types/plex';

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOKIE_NAME = 'plexport-session';

// Get secret key from environment or use a default for development
const getSecretKey = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET || 'development-secret-change-in-production';
  return new TextEncoder().encode(secret);
};

export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  console.log('getSession - Cookie found:', !!token);
  console.log('getSession - All cookies:', cookieStore.getAll().map(c => c.name));

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    console.log('getSession - Session valid for user:', (payload as any).user?.username);
    return payload as unknown as SessionData;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
