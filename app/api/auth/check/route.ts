import { NextRequest, NextResponse } from 'next/server';
import PlexClient from '@/lib/plex-client';
import { createSession, setSessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { pinId } = await request.json();

    if (!pinId) {
      return NextResponse.json({ error: 'PIN ID is required' }, { status: 400 });
    }

    const clientIdentifier =
      process.env.NEXT_PUBLIC_PLEX_CLIENT_IDENTIFIER || `plexport-${Date.now()}`;

    const plexClient = new PlexClient();
    const pin = await plexClient.checkPin(pinId, clientIdentifier);

    if (!pin.authToken) {
      return NextResponse.json({ authorized: false });
    }

    // Get user information
    const user = await plexClient.getUser(pin.authToken);

    // Get available servers
    const servers = await plexClient.getServers(pin.authToken);
    const primaryServer = servers.length > 0 ? servers[0] : undefined;

    // Create session with minimal data to keep JWT size small
    const sessionToken = await createSession({
      authToken: pin.authToken,
      userId: user.id,
      username: user.username,
    });

    console.log('Auth check - Setting cookie for user:', user.username);

    const response = NextResponse.json({
      authorized: true,
      user: {
        username: user.username,
        email: user.email,
        thumb: user.thumb,
      },
    });

    // Set the session cookie using Set-Cookie header
    const cookieOptions = [
      `plexport-session=${sessionToken}`,
      'Path=/',
      `Max-Age=${7 * 24 * 60 * 60}`,
      'HttpOnly',
      'SameSite=Lax',
      ...(process.env.NODE_ENV === 'production' ? ['Secure'] : []),
    ].join('; ');

    response.headers.set('Set-Cookie', cookieOptions);
    response.cookies.set('plexport-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    console.log('Auth check - Setting cookie for user:', user.username);
    console.log('Auth check - Response cookies:', response.cookies.getAll().map(c => c.name));

    return response;
  } catch (error) {
    console.error('Error checking PIN:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    );
  }
}
