import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import PlexClient from '@/lib/plex-client';

export async function GET(request: NextRequest) {
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
    const searchParams = request.nextUrl.searchParams;
    const sectionKey = searchParams.get('sectionKey');
    const type = searchParams.get('type'); // 'collections' or 'playlists'

    if (!sectionKey) {
      return NextResponse.json(
        { error: 'sectionKey is required' },
        { status: 400 }
      );
    }

    if (type === 'playlists') {
      // Fetch all playlists (not section-specific)
      const playlists = await plexClient.getPlaylists(
        primaryServer.host,
        session.authToken
      );
      return NextResponse.json({ items: playlists });
    }

    // Fetch collections for the section
    const collections = await plexClient.getCollections(
      primaryServer.host,
      session.authToken,
      sectionKey
    );

    return NextResponse.json({ items: collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}
