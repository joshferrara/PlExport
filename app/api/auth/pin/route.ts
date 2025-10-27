import { NextResponse } from 'next/server';
import PlexClient from '@/lib/plex-client';

export async function POST() {
  try {
    const clientIdentifier =
      process.env.NEXT_PUBLIC_PLEX_CLIENT_IDENTIFIER || `plexport-${Date.now()}`;

    const plexClient = new PlexClient();
    const pin = await plexClient.requestPin(clientIdentifier);

    return NextResponse.json({
      id: pin.id,
      code: pin.code,
      authUrl: `https://app.plex.tv/auth#?clientID=${clientIdentifier}&code=${pin.code}&context[device][product]=${process.env.NEXT_PUBLIC_PLEX_PRODUCT || 'PlExport'}`,
    });
  } catch (error) {
    console.error('Error requesting PIN:', error);
    return NextResponse.json(
      { error: 'Failed to request authentication PIN' },
      { status: 500 }
    );
  }
}
