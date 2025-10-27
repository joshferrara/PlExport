import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import PlexClient from '@/lib/plex-client';

export async function GET(request: NextRequest) {
  try {
    console.log('Session check - Cookies from request:', request.cookies.getAll().map(c => c.name));

    const session = await getSession();

    if (!session) {
      console.log('Session check - No session found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch server info dynamically
    const plexClient = new PlexClient();
    const servers = await plexClient.getServers(session.authToken);
    const primaryServer = servers.length > 0 ? servers[0] : null;

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.username,
        userId: session.userId,
      },
      server: primaryServer ? {
        name: primaryServer.name,
        version: primaryServer.version,
      } : null,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
