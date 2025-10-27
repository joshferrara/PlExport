import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import * as Papa from 'papaparse';
import type { MediaItem } from '@/types/plex';

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const { items, format, libraryType } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items to export' },
        { status: 400 }
      );
    }

    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv or json' },
        { status: 400 }
      );
    }

    // Format items based on library type
    const formattedItems = formatMediaItems(items, libraryType);

    if (format === 'json') {
      return new NextResponse(JSON.stringify(formattedItems, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="plex-export-${Date.now()}.json"`,
        },
      });
    }

    // CSV format
    const csv = Papa.unparse(formattedItems);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="plex-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

function formatMediaItems(items: MediaItem[], libraryType: string) {
  return items.map((item: any) => {
    const baseFields = {
      title: item.title || '',
      year: item.year || '',
      addedAt: item.addedAt ? new Date(item.addedAt * 1000).toISOString() : '',
      ratingKey: item.ratingKey || '',
    };

    // Movie-specific fields
    if (libraryType === 'movie') {
      return {
        ...baseFields,
        studio: item.studio || '',
        contentRating: item.contentRating || '',
        rating: item.rating || '',
        duration: item.duration ? Math.round(item.duration / 60000) : '', // Convert to minutes
        summary: item.summary || '',
        genres: item.Genre?.map((g: any) => g.tag).join(', ') || '',
        directors: item.Director?.map((d: any) => d.tag).join(', ') || '',
        actors: item.Role?.map((r: any) => r.tag).slice(0, 5).join(', ') || '',
      };
    }

    // TV Show-specific fields
    if (libraryType === 'show') {
      return {
        ...baseFields,
        studio: item.studio || '',
        contentRating: item.contentRating || '',
        rating: item.rating || '',
        seasons: item.childCount || '',
        episodes: item.leafCount || '',
        summary: item.summary || '',
        genres: item.Genre?.map((g: any) => g.tag).join(', ') || '',
      };
    }

    // Music Artist-specific fields
    if (libraryType === 'artist') {
      return {
        ...baseFields,
        summary: item.summary || '',
        genres: item.Genre?.map((g: any) => g.tag).join(', ') || '',
        country: item.Country?.map((c: any) => c.tag).join(', ') || '',
      };
    }

    // Music Album-specific fields
    if (libraryType === 'album') {
      return {
        ...baseFields,
        artist: item.parentTitle || '',
        studio: item.studio || '',
        rating: item.rating || '',
        genres: item.Genre?.map((g: any) => g.tag).join(', ') || '',
      };
    }

    // Default fields for unknown types
    return baseFields;
  });
}
