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
    const collectionKey = searchParams.get('collectionKey');
    const playlistKey = searchParams.get('playlistKey');
    const viewMode = searchParams.get('viewMode');

    if (!sectionKey && !collectionKey && !playlistKey) {
      return NextResponse.json(
        { error: 'sectionKey, collectionKey, or playlistKey is required' },
        { status: 400 }
      );
    }

    // Fetch collection items
    if (collectionKey) {
      const items = await plexClient.getCollectionItems(
        primaryServer.host,
        session.authToken,
        collectionKey
      );
      return NextResponse.json({ items });
    }

    // Fetch playlist items
    if (playlistKey) {
      const items = await plexClient.getPlaylistItems(
        primaryServer.host,
        session.authToken,
        playlistKey
      );
      return NextResponse.json({ items });
    }

    // Fetch library content
    if (sectionKey) {
      // Determine the type parameter based on viewMode
      // Type 8 = Artists, Type 9 = Albums
      let typeParam: string | undefined;
      if (viewMode === 'album') {
        typeParam = '9'; // Fetch albums
      } else if (viewMode === 'artist') {
        typeParam = '8'; // Fetch artists
      }
      // If viewMode is not set, don't pass type parameter (default behavior)

      const mediaContainer = await plexClient.getLibraryContent(
        primaryServer.host,
        session.authToken,
        sectionKey,
        typeParam
      );
      return NextResponse.json({
        items: mediaContainer.Metadata || [],
        total: mediaContainer.size,
      });
    }

    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error('Error fetching media:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
