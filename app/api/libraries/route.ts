import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import PlexClient from '@/lib/plex-client';

export async function GET() {
  try {
    const session = await requireSession();

    const plexClient = new PlexClient(session.authToken);

    // Get primary server
    const servers = await plexClient.getServers(session.authToken);
    if (servers.length === 0) {
      return NextResponse.json(
        { error: 'No Plex server available' },
        { status: 400 }
      );
    }

    const primaryServer = servers[0];
    console.log('Using Plex server:', { name: primaryServer.name, host: primaryServer.host });

    const libraries = await plexClient.getLibraries(
      primaryServer.host,
      session.authToken
    );

    return NextResponse.json({ libraries });
  } catch (error) {
    console.error('Error fetching libraries:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch libraries', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
